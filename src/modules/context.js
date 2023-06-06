const Cheerio = require("cheerio");
// @ts-ignore
const { isWithinTokenLimit, encode, decode } = require("gpt-tokenizer/model/text-davinci-003");

class GPTContext {
    /**
     * @param {string} question
     * @param {string} contextData
     */
    constructor(question, contextData) {
        this.context = "";
        this.question = question;
        this.contextData = contextData;
    }

    validateData() {
        return isWithinTokenLimit(this.context, 2000);
    }

    makeContext() {
        this.context = `Answer the question based on the context below, and if the question can't be answered based on the context, say \"I don't know\"\n\nContext: ${this.contextData}\n\n---\n\nQuestion: ${this.question}\nAnswer:`;
        console.log(this.validateData());
        return this.context;
    }

    toString() {
        this.makeContext();
        return this.context;
    }
}

class DataContext {
    constructor() {
        this.data = [];
        this.content = "";
    }

    toData() {
        return this.data;
    }

    /**
     * @param {string} dom
     */
    setDatafromHTML(dom) {
        this.content = dom;
        this.splitDataintoParas();
    }

    splitDataintoParas() {
        const data = [...splitChunk(this.content)];

        this.data.push(...data.map((d) => Cheerio.load(d).text()));
    }
}

//
// UTILS
//

/**
 * @param {string} data
 */
function* splitChunk(data) {
    let n = 1000,
        tokens = encode(data);

    for (let i = 0; i < tokens.length; i += n) {
        const temp = tokens.slice(i, i + n);
        yield decode(temp);
    }
}

module.exports = { splitChunk, GPTContext, DataContext };
