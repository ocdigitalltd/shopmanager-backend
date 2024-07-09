// import { Env } from "./src/base/loaders/appLoader";

// module.exports = Env.knex;

// for production: after tsc, comment above and uncomment below to run migrations or seeds
module.exports = {
    client: "pg",
    connection: {
        host: "node196112-db-cluster-pgre-1.de-fra1.cloudjiffy.net",
        user: "webadmin",
        password: "k9YZChhLj0",
        database: "shopmanager",
        charset: "utf8",
      },
    migrations: {
        directory: "dist/base/database/knex/migrations",
        extension: "js",
    },
    seeds: {
        directory: "dist/base/database/knex/seeds",
        extension: "js",
    },
};

// alter table relink_domains add column "isFixed" boolean default false