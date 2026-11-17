import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  test.skip(
    process.env.CEJ_LOCAL_INTEGRATION !== "1",
    "Requires isolated loopback stack via pnpm test:browser",
  );
  await page.goto("/login");
  await page.getByLabel("Correo").fill("owner-a@cej.invalid");
  await page.getByLabel("Contraseña").fill(process.env.CEJ_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/panel$/);
});
test("mobile quote persists, exports, reloads and never loads advertising Pixel", async ({
  page,
}) => {
  const advertising: string[] = [];
  page.on("request", (r) => {
    if (/facebook\.net|facebook\.com\/tr/.test(r.url()))
      advertising.push(r.url());
  });
  await page.getByRole("link", { name: "Cotizar", exact: true }).click();
  await page.getByLabel("Volumen solicitado (m³)").fill("14");
  await page
    .getByRole("button", { name: "Guardar cotización", exact: true })
    .click();
  await expect(page).toHaveURL(/\/panel\/cotizaciones\/[0-9a-f-]+$/);
  await expect(
    page.getByText("COTIZACIÓN GENÉRICA", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Folio C-", { exact: false })).toBeVisible();
  const url = page.url();
  await page.reload();
  await expect(page).toHaveURL(url);
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: /PDF/ }).click();
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
  expect(advertising).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe(
    "BODY",
  );
  await page.screenshot({
    path: "docs/evidence/quote-mobile.png",
    fullPage: true,
  });
});
test("customer creation and direct order confirm without deposit, schedule and preserve search", async ({
  page,
}) => {
  const name = `Cliente navegador ${Date.now()}`;
  await page.goto("/panel/clientes/nuevo");
  await page.getByLabel("Nombre del cliente").fill(name);
  await page.getByRole("button", { name: "Guardar cliente" }).click();
  await expect(page).toHaveURL(/\/panel\/clientes\/[0-9a-f-]+$/);
  await page.goto("/panel/cotizar");
  await page
    .getByLabel("Capturar pedido directo, sin cotización previa")
    .check();
  await page.getByLabel("Buscar cliente por nombre o teléfono").fill(name);
  await page.getByRole("button", { name: "Buscar clientes y obras" }).click();
  await expect(
    page.getByRole("button", { name: "Buscar clientes y obras" }),
  ).toBeEnabled();
  await page
    .getByRole("combobox", { name: "Cliente", exact: true })
    .selectOption({ label: `${name} · sin teléfono` });
  await page
    .getByLabel("Dirección de entrega")
    .fill("Obra sintética de navegador");
  await page.getByLabel("Volumen solicitado (m³)").fill("10");
  await page
    .getByRole("button", { name: "Guardar pedido en borrador" })
    .click();
  await expect(page).toHaveURL(/\/panel\/pedidos\/[0-9a-f-]+$/);
  const folio = await page.getByRole("heading", { level: 1 }).innerText();
  await page
    .getByLabel("El cliente aceptó esta oferta y el equipo confirma el pedido")
    .check();
  await page
    .getByLabel("Fecha de aceptación (hora de tu dispositivo)")
    .fill("2026-11-13T12:00");
  await page
    .getByRole("button", { name: "Confirmar venta", exact: true })
    .click();
  await expect(
    page.getByText("Venta: confirmada", { exact: false }),
  ).toBeVisible();
  await page
    .getByLabel("Inicio (hora de tu dispositivo)")
    .fill("2026-12-05T10:00");
  await page
    .getByLabel("Fin (hora de tu dispositivo)")
    .fill("2026-12-05T11:00");
  await page
    .getByLabel("Motivo de programación")
    .fill("Ensayo de programación por teclado");
  await page
    .getByLabel("Revisé los pedidos coincidentes y confirmo el cruce")
    .check();
  await page.getByRole("button", { name: "Guardar programación" }).click();
  await expect(
    page.getByText("Entrega:", { exact: false }).first(),
  ).toBeVisible();
  await page.goto(`/panel/pedidos?q=${encodeURIComponent(folio)}`);
  await page.getByRole("link", { name: folio, exact: true }).click();
  await page
    .getByRole("link", { name: "Volver a los pedidos y filtros" })
    .click();
  await expect(
    page.getByLabel("Buscar por folio actual/anterior, cliente o teléfono"),
  ).toHaveValue(folio);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/evidence/orders-mobile.png",
    fullPage: true,
  });
});
test("public calculator and compatibility routes remain available", async ({
  page,
}) => {
  await page.goto("/dashboard/orders");
  await expect(page).toHaveURL(/\/panel\/pedidos$/);
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
  await page.goto("/cotizador");
  await expect(page.getByRole("main")).toBeVisible();
  await page.getByText("Sí", { exact: true }).click();
  await page.getByLabel("Volumen (m³)", { exact: true }).fill("5");
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByLabel("Producto y especificación").selectOption("250");
  await page.getByRole("button", { name: "Ver Cotización Final" }).click();
  await expect(
    page.getByText("Cotización Lista", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Agregar al Pedido/ }).click();
  await page
    .getByRole("button", { name: "Finalizar Pedido por WhatsApp" })
    .click();
  // Prepare the existing WhatsApp handoff without opening a third-party page or sending a message.
  await page.evaluate(() => {
    window.open = (url) => {
      document.documentElement.dataset.preparedWhatsApp = String(url);
      return null;
    };
  });
  await page
    .getByLabel("Nombre", { exact: true })
    .fill("Cliente público sintético");
  await page.getByLabel("Teléfono", { exact: true }).fill("6561234567");
  await page
    .getByRole("checkbox", { name: "Acepto el aviso de privacidad" })
    .check();
  await page
    .getByRole("button", { name: "Enviar Pedido", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.dataset.preparedWhatsApp),
    )
    .toMatch(/^https:\/\/wa\.me\//);
});

test("inline customer and project capture preserve the quote and selected work", async ({
  page,
}) => {
  const token = Date.now();
  await page.goto("/panel/cotizar");
  await page.getByLabel("Volumen solicitado (m³)").fill("15");
  await page.getByLabel("Tipo de cotización").selectOption("formal");
  await page
    .getByText("Alta breve de cliente sin perder la captura", { exact: true })
    .click();
  await page.getByLabel("Nombre del nuevo cliente").fill(`Alta breve ${token}`);
  await page
    .getByRole("button", { name: "Crear y seleccionar cliente" })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Cliente", exact: true }),
  ).not.toHaveValue("");
  await page
    .getByText("Alta breve de obra para el cliente seleccionado", {
      exact: true,
    })
    .click();
  await page.getByLabel("Nombre de la nueva obra").fill(`Obra breve ${token}`);
  await page
    .getByLabel("Dirección de la nueva obra")
    .fill("Dirección sintética de ensayo");
  await page.getByRole("button", { name: "Crear y seleccionar obra" }).click();
  await expect(
    page.getByRole("combobox", { name: "Obra", exact: true }),
  ).not.toHaveValue("");
  await expect(page.getByLabel("Volumen solicitado (m³)")).toHaveValue("15");
  await page
    .getByRole("button", { name: "Guardar cotización", exact: true })
    .click();
  await expect(page).toHaveURL(/\/panel\/cotizaciones\/[0-9a-f-]+$/);
  await expect(
    page.getByText(`Obra: Obra breve ${token}`, { exact: false }),
  ).toBeVisible();
});
