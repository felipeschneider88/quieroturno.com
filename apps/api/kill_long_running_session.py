#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
@author: Liang Chen
"""

import azutil
import pyodbc
import multiprocessing
import csv
import re
#import numpy
from prettytable import PrettyTable

LONG_RUNNING_THRESHOLD = 3600000
#DTU_THRESHOLD_PERCENT = 90

get_long_running_sessoin_sql = '''
SELECT req.session_id,
       req.start_time,
       req.status,
	   req.cpu_time/1000,
       req.total_elapsed_time/1000,
	   SUBSTRING(ST.text, (req.statement_start_offset / 2)+1, ((CASE statement_end_offset WHEN -1 THEN DATALENGTH(ST.text)ELSE req.statement_end_offset END-req.statement_start_offset)/ 2)+1) AS query_text
FROM sys.dm_exec_requests AS req
JOIN sys.dm_exec_sessions AS sess
ON req.session_id = sess.session_id
CROSS APPLY sys.dm_exec_sql_text(req.sql_handle) AS st
WHERE req.status <> 'running'
AND sess.login_name not like '%sap.com'
AND sess.login_name not like '%dba%'
AND sess.login_name not like 'dbown'
AND req.total_elapsed_time > ''' + str(LONG_RUNNING_THRESHOLD) + ' ORDER BY req.total_elapsed_time DESC'

get_blocked_session_sql = '''
SELECT req.Session_id
FROM sys.dm_exec_requests req        
OUTER APPLY sys.dm_exec_sql_text(req.sql_handle) st
WHERE req.blocking_session_id <> 0
'''

replication_role_sql = 'select top 1 role from sys.dm_geo_replication_link_status'

#dtu_percent_sql = '''
#SELECT
#   convert(decimal(18, 0), (SELECT Max(v)    
#   FROM (VALUES (avg_cpu_percent), (avg_data_io_percent), (avg_log_write_percent)) AS    
#   value(v))) AS [avg_DTU_percent]
#FROM sys.dm_db_resource_stats
#WHERE end_time>=DATEADD(MINUTE, -10, GETUTCDATE())
#'''

def is_excluded_db(server, database):
        exclude_db_list_file = 'C:/Users/Azure/iops/scripts/exclude_kill_long_running_db_list.txt'
        with open(exclude_db_list_file) as exclude_file:
            csv_reader = csv.reader(exclude_file, delimiter = ',')
            next(csv_reader)
            exclude_db_list = list(csv_reader)
        return True if [server, database] in exclude_db_list else False
        
def kill_long_running_session(line):
    server = azutil.get_server_name(line)
    database = azutil.get_db_name(line)
    db_type = azutil.get_db_type(database)
    live_status = azutil.get_live_status(line)
    live = True if live_status == 'Live' else False
    env = azutil.get_env()
    if env == 'DEV':
        if db_type != 'd':
            return
    if env == 'STG':
        if db_type != 's':
            return
    if env == 'PROD':
        if db_type != 'p':
            return
    if re.match(r'^(snap|snapshot)-\d+-',database):
        return
    if not live:
        return
    if 'datahub' in database:
        return 

    severity='INFO'
    job_status='PASS'
    detail=''

    try:
        cursor = azutil.create_db_connection(server, database, autocommit=True)
    except:
        job_status = 'FAILED'
        severity = azutil.set_severity(database, live)
        detail = 'Connection to Database timed out'
        azutil.set_log_output(server,database,live_status,detail=detail,severity=severity,job_status=job_status)
        return
    cursor.execute(replication_role_sql)
    replication_role = cursor.fetchone()
    if replication_role and replication_role[0] == 1:
        return
        
    cursor.execute(get_long_running_sessoin_sql)
    long_running_sessions = cursor.fetchall()

    if long_running_sessions:
#        cursor.execute(dtu_percent_sql)
#        dtu_percent_avg_result = cursor.fetchall()
#        dtu_percent_avg_list = list(dtu_percent_avg_result)
#        dtu_percent_avg = round(numpy.median(dtu_percent_avg_list))
#        severity = 'SEV1' if dtu_percent_avg >= DTU_THRESHOLD_PERCENT else 'SEV2'
        severity = 'SEV2'
        cursor.execute(get_blocked_session_sql)
        blocked_session_ids = cursor.fetchall()
        blocked_session_ids_list = []
        if blocked_session_ids:
            for blocked_session_id in blocked_session_ids:
                sess_id = blocked_session_id[0]
                blocked_session_ids_list.append(sess_id)
        long_running_sessions_table = PrettyTable(["sess_id","start_time","status","cpu_time_in_sec","total_elapsed_time_in_sec","query_text"])
        long_running_sessions_table.align["query_text"] = 'l'
        to_be_killed_sess_ids_list = []
        for long_running_session in long_running_sessions:
            long_running_session_id = long_running_session[0]
            if long_running_session_id not in blocked_session_ids_list:
                to_be_killed_sess_ids_list.append(long_running_session_id)
                long_running_sessions_table.add_row(list(long_running_session))
        if not to_be_killed_sess_ids_list:
            detail += 'Long running sessions are due to being blocked. Not to kill it.'
            azutil.set_log_output(server,database,live_status,detail=detail,severity=severity,job_status=job_status)
            return
        long_running_sessions_table_html = long_running_sessions_table.get_html_string(attributes={
            'width': '100%',
            'align': 'centre',
            'BORDERCOLOR': '#330000',
            'border': 2,
        })
        detail += 'Following session(s) running for > ' + str(LONG_RUNNING_THRESHOLD//(1000*60)) + ' mins:\n' + long_running_sessions_table_html + '\n'

        if is_excluded_db(server, database):
            detail += 'Not to kill above long running sessions as per customer request. Please investigate and inform customer if needed.\n'
        else:
            detail += 'Killed above long running sessions:\n'
            for session_to_be_killed in to_be_killed_sess_ids_list:
                cursor.execute('KILL ' + str(session_to_be_killed))
                detail += 'KILL ' + str(session_to_be_killed) + '\n'

        email_subject = '[' + severity + ']_[CCv2 ' + env + ']_[' + live_status + '] Long running sessions > ' + str(LONG_RUNNING_THRESHOLD//(1000*60)) + ' mins / ' + database
        email_message = '<br/>'.join(detail.splitlines())
        if severity == 'SEV1':
            azutil.send_email_notification(email_subject, email_message, receiver = ['DL_5C59DCC39B71B40285BC8E67@global.corp.sap','hybris_dbcoe_bigdata@sap.com'])
        else:
            azutil.send_email_notification(email_subject, email_message, receiver = ['hybris_dbcoe_bigdata@sap.com'])

    else:
        detail = 'No long running sessions'

    azutil.set_log_output(server,database,live_status,detail=detail,severity=severity,job_status=job_status)

def main():
    pool = multiprocessing.Pool(10)
    with open(azutil.db_server_current) as f:
        csv_reader = csv.reader(f, delimiter = ',')
        next(csv_reader)
        pool.map(kill_long_running_session, csv_reader)

if __name__ == "__main__":
    main()
