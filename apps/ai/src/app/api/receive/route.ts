import type { ParsedMail, Source } from "mailparser";
import { simpleParser } from "mailparser";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import prisma from "@calcom/prisma";

import { env } from "../../../env.mjs";
import { fetchAvailability } from "../../../tools/getAvailability";
import { fetchEventTypes } from "../../../tools/getEventTypes";
import getHostFromHeaders from "../../../utils/host";
import now from "../../../utils/now";
import sendEmail from "../../../utils/sendEmail";
import { verifyParseKey } from "../../../utils/verifyParseKey";

/**
 * Verifies email signature and app authorization,
 * then hands off to booking agent.
 */
export const POST = async (request: NextRequest) => {
  const verified = verifyParseKey(request.url);

  if (!verified) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const body = Object.fromEntries(formData);

  // body.dkim looks like {@domain-com.22222222.gappssmtp.com : pass}
  const signature = (body.dkim as string).includes(" : pass");

  const envelope = JSON.parse(body.envelope as string);

  const aiEmail = envelope.to[0];

  // Parse email from mixed MIME type
  const parsed: ParsedMail = await simpleParser(body.email as Source);

  if (!parsed.text && !parsed.subject) {
    return new NextResponse("Email missing text and subject", { status: 400 });
  }

  const user = await prisma.user.findUnique({
    select: {
      email: true,
      id: true,
      credentials: {
        select: {
          appId: true,
          key: true,
        },
      },
    },
    where: { email: envelope.from },
  });

  if (!signature || !user?.email || !user?.id) {
    await sendEmail({
      subject: `Re: ${body.subject}`,
      text: "Sorry, you are not authorized to use this service. Please verify your email address and try again.",
      to: user?.email || "",
      from: aiEmail,
    });

    return new NextResponse();
  }

  const credential = user.credentials.find((c) => c.appId === env.APP_ID)?.key;

  // User has not installed the app from the app store. Direct them to install it.
  if (!(credential as { apiKey: string })?.apiKey) {
    const url = env.APP_URL;

    await sendEmail({
      html: `Thanks for using Cal AI! To get started, the app must be installed. <a href=${url} target="_blank">Click this link</a> to install it.`,
      subject: `Re: ${body.subject}`,
      text: `Thanks for using Cal AI! To get started, the app must be installed. Click this link to install the Cal AI app: ${url}`,
      to: envelope.from,
      from: aiEmail,
    });

    return new NextResponse("ok");
  }

  const { apiKey } = credential as { apiKey: string };

  // Pre-fetch data relevant to most bookings.
  const [eventTypes, availability] = await Promise.all([
    fetchEventTypes({
      apiKey,
    }),
    fetchAvailability({
      apiKey,
      userId: user.id,
      dateFrom: now,
      dateTo: now,
    }),
  ]);

  if ("error" in availability) {
    await sendEmail({
      subject: `Re: ${body.subject}`,
      text: "Sorry, there was an error fetching your availability. Please try again.",
      to: user.email,
      from: aiEmail,
    });
    console.error(availability.error);
    return new NextResponse("Error fetching availability. Please try again.", { status: 400 });
  }

  if ("error" in eventTypes) {
    await sendEmail({
      subject: `Re: ${body.subject}`,
      text: "Sorry, there was an error fetching your event types. Please try again.",
      to: user.email,
      from: aiEmail,
    });
    console.error(eventTypes.error);
    return new NextResponse("Error fetching event types. Please try again.", { status: 400 });
  }

  const { timeZone, workingHours } = availability;

  const appHost = getHostFromHeaders(request.headers);

  // Hand off to long-running agent endpoint to handle the email. (don't await)
  fetch(`${appHost}/api/agent?parseKey=${env.PARSE_KEY}`, {
    body: JSON.stringify({
      apiKey,
      userId: user.id,
      message: parsed.text,
      subject: parsed.subject,
      replyTo: aiEmail,
      user: {
        email: user.email,
        eventTypes,
        timeZone,
        workingHours,
      },
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  await new Promise((r) => setTimeout(r, 1000));

  return new NextResponse("ok");
};
