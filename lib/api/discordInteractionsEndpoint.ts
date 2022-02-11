import type {APIGatewayProxyEventV2, APIGatewayProxyResultV2,} from 'aws-lambda';
import * as nacl from "tweetnacl";
import * as chrono from 'chrono-node'
import * as console from "console";

// const casual_le = new chrono.Chrono(chrono.en.createCasualConfiguration(true))
// const casual_me = new chrono.Chrono(chrono.en.createCasualConfiguration(false))


export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    if(!verifyKey(
        event.body || "",
        event.headers['x-signature-ed25519'] || "",
        event.headers['x-signature-timestamp'] || "",
        process.env.PUBLIC_KEY || ""
    )) {
        return jsonResponse("invalid request signature", 401)
    }

    const body = JSON.parse(event.body || "{}")

    if (body.type == 1) {
        return jsonResponse({type: 1})
    } else if (body.type == 2) {
        let content = "Unable to parse input"
        let ephemeral = true

        if (body.data.name == 'timestamp') {
            const format = body.data.options[0].value
            const input = body.data.options[1].value
            const {parsingResult, epoch} = parseDate(input, false, "CST");
            if (epoch > 0) {
                content = `${input.substring(0, parsingResult[0].index)} <t:${epoch}:${format}>`
                ephemeral = false
            }
        }

        if (body.data.name == 'stamp') {
            if (body.data.options[0].name == 'configure') {
                content = "This feature will be added in a later release"
            }
            if (body.data.options[0].name == 'help') {
                content = "A bot for generating Discord timestamps: <t:1641016800:f> from natural language input \n" +
                    "Example messages that can be parsed: \n" +
                    "\"Tomorrow at 5pm EST\", \"May 4, 2023 3:45pm CEST\", \"at 4:45 pm GMT-5\" \n" +
                    "Note: Date format defaults to M/D/Y if it is ambiguous\n\n" +
                    "**Commands** \n" +
                    "`/timestamp [output format] [message]` " +
                    "Parses the message and replaces any mentioned date/time with a Discord timestamp.\n" +
                    "`/stamp generate [output format] [message]` " +
                    "Parses the message and replies only to you with a Discord timestamp string for you to copy/paste into other messages.";
            }
            if (body.data.options[0].name == 'generate') {
                const format = body.data.options[0].options[0].value
                const input = body.data.options[0].options[1].value
                const {parsingResult, epoch} = parseDate(input, false, "CST");
                if (epoch > 0) {
                    content = `\`<t:${epoch}:${format}>\``
                }
            }
        }

        return jsonResponse({
            type: 4,
            data: {
                tts: false,
                content: content,
                flags: ephemeral ? 1<<6 : 0
            }
        })
    }

    return jsonResponse("Unknown type", 500)
};


function parseDate(input: any, littleEndian: boolean, timezone: string | undefined) {
    const parsingResult = chrono.parse(input, {instant: new Date()}, {forwardDate: true})
    let epoch = 0
    if (parsingResult.length > 0) {
        epoch = parsingResult[0].start.date().getTime() / 1000
    }

    return {parsingResult, epoch};
}


export function jsonResponse(body: any, code: number = 200) {
    return {
        "statusCode": code,
        "body": JSON.stringify(body),
        "headers": {
            "Content-Type": "application/json"
        }
    }
}


/**
 * Validates a payload from Discord against its signature and key.
 *
 * @param body - The raw payload data
 * @param signature - The signature from the `X-Signature-Ed25519` header
 * @param timestamp - The timestamp from the `X-Signature-Timestamp` header
 * @param clientPublicKey - The public key from the Discord developer dashboard
 * @returns Whether or not validation was successful
 */
function verifyKey(
    body: string,
    signature: string,
    timestamp: string,
    clientPublicKey: string,
): boolean {
    try {
        return nacl.sign.detached.verify(
            Buffer.from(timestamp + body),
            Buffer.from(signature, 'hex'),
            Buffer.from(clientPublicKey, 'hex')
        );
    } catch (ex) {
        console.error('[discord-interactions]: Invalid verifyKey parameters', ex);
        return false;
    }
}
