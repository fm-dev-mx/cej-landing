# Validated CEJ commercial profile

T1422 cej-validar-datos-comerciales uses the owner's confirmation dated
2026-11-18. These values are operational data, not a database migration or a
default that silently validates a company. Local configuration does not carry
over to Production.

## Capture through the panel

Only the owner or an explicitly authorised Production operator may perform this
procedure in Production. The current panel and RPC require the `owner` company
role; `admin` can view settings but cannot validate the profile. Do not change
memberships merely to work around this requirement.

1. Confirm the environment and intended company before signing in. For local
   rehearsal, use the isolated stack at `http://127.0.0.1:55421` and the synthetic
   `owner-a@cej.invalid` user prepared by `pnpm local:seed`. Never reset the local
   database: it holds the T1421 import rehearsal. Integration tests overwrite
   this synthetic company's profile; capture these values **after** those tests.
2. Open `/panel/configuracion` and enter:

   | Field | Confirmed value |
   | --- | --- |
   | Nombre o razón social validada | Concreto y equipos de Ciudad Juárez · ATICO DE CHIHUAHUA S DE RL DE CV |
   | RFC real validado | ACI170303IU9 |
   | Domicilio real validado | Plaza Micaela, Gómez Morín 9321, local 6, Ciudad Juárez |
   | Contacto comercial validado | Teléfono y WhatsApp: 656 202 4139; contacto@concretodejuarez.com |
   | Vigencia autorizada (días) | 7 |
   | Tratamiento de IVA de los $1,500 de Samalayuca | IVA incluido en la tarifa (`included`) |
   | Tasa confirmada de IVA del flete | 0.16 |

   Use the following text for **Condiciones comerciales validadas**:

   > Pago de preferencia 24 h antes del colado, en efectivo, tarjeta o
   > transferencia; en la oficina o al hacer la volumetría (cuando aplique).
   > Programación incluso de un día para otro, según disponibilidad.
   > Reprogramación sí, avisando con anticipación.

3. Check **Validé los datos, la vigencia y las condiciones comerciales**, then
   select **Guardar configuración validada**. Reload settings and verify all
   saved fields. The fiscal regime was not supplied: omit it. Do not put bank
   details in code, this document, the board or test fixtures.
4. Confirm that **Perfil empresarial real**, **Vigencia y condiciones
   comerciales** and **IVA del flete de Samalayuca** no longer appear as pending.
   Meta eligibility and Excel control totals have separate validation gates.
5. Locally, create a synthetic customer and a **new** formal quote: 7 m³ of
   direct concrete, Samalayuca, 7 m³ truck capacity, one suggested truck, no
   discount or tariff override. Verify the formal status, issuer/RFC, office
   address, contact, payment conditions and expiry exactly seven days after
   issue. Freight must be $1,500 including 16% VAT, not $1,740. Export the PDF
   and verify the same values. Do not confirm a sale, record a payment or send
   the document. In Production, the owner chooses any verification record.

Existing quote revisions retain their original snapshots; saving settings does
not retroactively authorise them. A new revision is needed to use this profile.

## Customer-facing location

Offices receive customers: Plaza Micaela, Gómez Morín 9321, local 6, Ciudad
Juárez. [Office map](https://maps.app.goo.gl/u2BujWzBWw62vsibA).

The plant at Turbosina 9410, entrance through Aeronáutica, **does not receive
customers**. [Plant map](https://maps.app.goo.gl/hUPx87qXPaBWTCt19).
Do not use the former Ejército Nacional 6225 address. Office coordinates,
neighbourhood and postal code were not supplied; do not reuse the plant's.

Public phone and WhatsApp configuration must also be checked by the owner when
shipping: 656 202 4139, WhatsApp international digits `526562024139`. Environment
overrides can replace the code defaults. No Production configuration is changed
by this task.
