describe("Homepage", () => { beforeAll(async () => { await page.goto("http://localhost:3333"); }); it("should have the correct title", async () => { await expect(page.title()).resolves.toMatch("ThinkFlow"); }); it("should have a Try Now button", async () => { const buttons = await page.$$("a.btn"); expect(buttons.length).toBeGreaterThan(0); }); });
