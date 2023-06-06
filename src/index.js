require("dotenv").config();

const App = require("./app/app");
const Fuse = require("fuse.js");
const inquirer = require("inquirer");

inquirer.registerPrompt("checkbox-plus", require("inquirer-checkbox-plus-prompt"));

const app = new App();
const { prompt } = inquirer;

//

void (async function run() {
    await app.init();

    const { mainUrl } = await prompt([{ type: "input", name: "mainUrl", message: "Enter the URL you want to crawl:" }]);

    const urls = await app.getURLs(mainUrl);

    // @ts-ignore
    const fuse = new Fuse(urls, {});

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

    console.log("Completed");

    while (true) {
        const { question } = await prompt([
            {
                type: "input",
                name: "question",
                message: "Ask a question: ",
            },
        ]);
        if (question === ".exit") break;

        const answer = (await app.searchQuestion(question)) ?? "Uh oh..! This is an unusual event!";
        console.log(answer);
    }
})();
