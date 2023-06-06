require("dotenv").config();

const App = require("./app1");
const Fuse = require("fuse.js");
const { writeFileSync } = require("fs");
const inquirer = require("inquirer");

inquirer.registerPrompt("checkbox-plus", require("inquirer-checkbox-plus-prompt"));

const NAMESPACE = "SomeRandomUderId";

//

void (async function run() {
    const app = new App();

    await app.init();

    const {
        prompt,
        ui: { BottomBar },
    } = inquirer;

    const { mainUrl } = await prompt([{ type: "input", name: "mainUrl", message: "Enter the URL you want to crawl:" }]);

    const urls = await app.getURLs(mainUrl);

    // @ts-ignore
    const fuse = new Fuse(urls, {});

    // const chunks = [];

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

    await app.processDocuments(...selectedUrls);

    // for (const url of selectedUrls) {
    //     const embededData = await processPage(url);
    //     chunks.push(parseData(embededData, url, mainUrl));
    // }

    // await uploadData(chunks, NAMESPACE);
    console.log("Completed");
    const UI = new BottomBar();

    UI.updateBottomBar(`Enter ".exit" as question to exit this frame`);

    while (true) {
        const { question } = await prompt([
            {
                type: "input",
                name: "question",
                message: "Ask a question: ",
            },
        ]);
        if (question === ".exit") break;

        await app.searchQuestion(question);
    }

    // DEV: SAVE TO DISK
    // writeFileSync("test.json", JSON.stringify(chunks));

    // Remove next line to preserve the browser client
    // await app.close();
})();
