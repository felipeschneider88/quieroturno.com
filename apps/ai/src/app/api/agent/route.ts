import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import agent from "../../../utils/agent";
import sendEmail from "../../../utils/sendEmail";
import { verifyParseKey } from "../../../utils/verifyParseKey";

/**
 * Launches a LangChain agent to process an incoming email,
 * then sends the response to the user.
 */
export const POST = async (request: NextRequest) => {
  const verified = verifyParseKey(request.url);

  if (!verified) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await request.json();

  const { apiKey, userId, message, subject, user, replyTo } = json;

  if ((!message && !subject) || !user) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  try {
    const response = await agent(`${subject}\n\n${message}`, user, apiKey, userId);

    // Send response to user
    await sendEmail({
      subject: `Re: ${subject}`,
      text: response.replace(/(?:\r\n|\r|\n)/g, "\n"),
      to: user.email,
      from: replyTo,
    });

    return new NextResponse("ok");
  } catch (error) {
    return new NextResponse(
      (error as Error).message || "Something went wrong. Please try again or reach out for help.",
      { status: 500 }
    );
  }
};
