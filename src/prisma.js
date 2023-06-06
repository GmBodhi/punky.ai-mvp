const { PrismaClient } = require("@prisma/client");

class Prisma {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async conn() {
        return await this.prisma.$connect();
    }

    async disconn() {
        return await this.prisma.$disconnect();
    }

    /**
     * @param {string} id
     */
    async getProduct(id) {
        return await this.prisma.product.findUnique({ where: { id } });
    }

    /**
     * @param {string} id
     */
    async getDocument(id) {
        return await this.prisma.document.findUnique({ where: { id } });
    }

    /**
     * @param {Document[]} documents
     */
    async writeDocuments(documents) {
        const data = [];
        for (const doc of documents) {
            const temp = await this.prisma.document.upsert({
                where: { id: doc.id },
                create: { ...doc },
                update: { ...doc },
            });
            data.push(temp);
        }

        return data;
    }

    /**
     * @param {string[]} ids
     */
    async getDocuments(...ids) {
        const docs = [];
        for (const id of ids) {
            const temp = await this.prisma.document.findUnique({ where: { id } });
            temp && docs.push(temp);
        }
        return docs;
    }
}

/**
 * @typedef Document
 * @property {string=} id
 * @property {string} namespace
 * @property {string} content
 */

/**
 * @typedef Product
 * @property {string=} id
 * @property {string[]} documentIDs
 * @property {string} namespace
 */

module.exports = { Prisma };
