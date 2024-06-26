import { useRouter } from "next/navigation";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { showToast, TopBanner } from "@calcom/ui";

export function OrgUpgradeBanner() {
  const { t } = useLocale();
  const router = useRouter();
  const { data } = trpc.viewer.organizations.checkIfOrgNeedsUpgrade.useQuery();
  const publishOrgMutation = trpc.viewer.organizations.publish.useMutation({
    onSuccess(data) {
      router.push(data.url);
    },
    onError: (error) => {
      showToast(error.message, "error");
    },
  });

  if (!data) return null;
  const [membership] = data;
  if (!membership) return null;

  return (
    <TopBanner
      text={t("org_upgrade_banner_description", { teamName: membership.team.name })}
      variant="warning"
      actions={
        <button
          className="border-b border-b-black"
          onClick={() => {
            publishOrgMutation.mutate();
          }}>
          {t("upgrade_banner_action")}
        </button>
      }
    />
  );
}
