const cheerio = require("cheerio");

const pptr = require("puppeteer");

module.exports.WebSpider = class WebSpider {
    //

    /**
     * @property {undefined|pptr.Browser} browser
     */

    constructor() {
        this.browser = null;
    }

    //

    async launch() {
        this.browser = await pptr.launch({
            headless: "new",
        });
        console.log("pptr: Browser Launched");
    }

    //

    /**
     *
     * @param {string} site
     * @returns {Promise<cheerio.CheerioAPI>}
     */

    async crawl(site) {
        if (!this.browser) return this.launch().then(() => this.crawl(site));

        const page = await this.browser.newPage();

        await page.goto(site, { waitUntil: "networkidle0" });

        const html = await page.content();

        await page.close();

        const DOM = cheerio.load(html);

        return DOM;
    }

    //

    /**
     *
     * @param {cheerio.CheerioAPI} dom
     */

    makeTextFromDOM(dom) {
        dom("style").text("");
        dom("script").text("");

        return dom.text().replace(/\s+/g, " ");
    }

    //

    /**
     *
     * @param {cheerio.CheerioAPI} dom
     * @param {string} base
     * @returns {string[]}
     */

    detectPaths(dom, base) {
        const exclusions = ["", "#", "javascript:void(0)"];
        const URLs = Array.from(dom("a"))
            .map((el) => {
                const href = el.attribs.href;
                if (exclusions.includes(href.toLowerCase())) return undefined;
                const url = parseURL(base, href);
                return url;
            })
            .filter((href) => !!href);

        // @ts-ignore
        return [...new Set(URLs)];
    }

    //
};

/**
 *
 * @param {string} base
 * @param {string} URLlike
 */
function parseURL(base, URLlike) {
    let url;
    try {
        url = new URL(URLlike);
    } catch (error) {
        try {
            url = new URL(base + URLlike);
        } catch (e) {
            url = null;
        }
    }

    if (!url || url?.hostname !== new URL(base).hostname) return null;

    return url.href;
}
