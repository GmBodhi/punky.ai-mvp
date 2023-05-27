require("dotenv").config();

const { getURLs, init, processPage, parseData, uploadData, pinecone } = require("./app");
const Fuse = require("fuse.js");
const { writeFileSync } = require("fs");

const NAMESPACE = "SomeRandomUderId";

//

void (async function run() {
    await init();

    const inquirer = (await import("inquirer")).default;

    inquirer.registerPrompt("checkbox-plus", require("inquirer-checkbox-plus-prompt"));

    const { prompt } = inquirer;

    const { mainUrl } = await prompt([{ type: "input", name: "mainUrl", message: "Enter the URL you want to crawl:" }]);

    const urls = await getURLs(mainUrl);

    // @ts-ignore
    const fuse = new Fuse(urls, {});

    const chunks = [];

    const { urls: selectedUrls } = await prompt([
        {
            type: "checkbox-plus",
            name: "urls",
            message: "Select the URLs that you want to use",
            highlight: true,
            searchable: true,
            source: async (_, input = "") => {
                if (!input.length) return urls;

                const results = fuse.search(input);

                return results.map((r) => r.item);
            },
        },
    ]);

    for (const url of selectedUrls) {
        const embededData = await processPage(url);
        chunks.push(parseData(embededData, url));
    }

    await uploadData(chunks, NAMESPACE);
    console.log("Completed");

    // DEV: SAVE TO DISK
    writeFileSync("test.json", JSON.stringify(chunks));
})();
