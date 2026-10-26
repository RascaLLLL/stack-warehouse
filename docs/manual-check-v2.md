# Manual screenshot code, version 2

The `/cek` page checks the visible `SWM2-XXXX-XXXX` code from the result card
using these fields: normalized name, NIM, and class; total score; total correct;
Stack correct; Queue correct; hint count; and attempt number. Stack and Queue
correct counts must sum to the total correct count. The score range is 0–4200,
and each topic has at most 10 correct answers.

The checksum object uses `application: "id.stackwarehouse.manual"` and
`version: 2`, followed by those nine fields. It uses the same sorted-key JSON,
UTF-8, and CRC-32/IEEE algorithm as the PNG payload, with prefix `SWM2`.

Names and classes are NFC-normalized, trimmed, and have repeated whitespace
collapsed to one space. NIM is NFC-normalized, trimmed, and uppercased. Numeric
fields accept decimal dots or commas for the score and digits for counts. The
checker rejects malformed values and inconsistent totals.

Manual code matching means only that the entered fields are consistent with the
displayed code. The `SW3` PNG code covers the full session and cannot be checked
from screenshot fields. Neither code is a signature or proof of authenticity.
