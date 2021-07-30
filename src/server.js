require("dotenv").config();
import http from "http";
import express from "express";
import logger from "morgan";
import { ApolloServer } from "apollo-server-express";
import { typeDefs, resolvers } from "./schema";
import { getUser } from "./users/users.utils";
import { graphqlUploadExpress } from "graphql-upload"; // 추가

const PORT = process.env.PORT;
const apollo = new ApolloServer({
  typeDefs,
  resolvers,
  //FIXME:  실제 개발상태에서는 playground, introspection false 로 전환
  playground: true,
  introspection: true,
  uploads: false, // 추가
  context: async (ctx) => {
    if (ctx.req) {
      return {
        loggedInUser: await getUser(ctx.req.headers.token),
        headers: ctx.req.headers,
      };
    } else {
      const {
        connection: { context },
      } = ctx;
      return {
        loggedInUser: context.loggedInUser,
      };
    }
  },
  subscriptions: {
    onConnect: async ({ token }) => {
      if (!token) {
        throw new Error("You can't listen.");
      }
      const loggedInUser = await getUser(token);
      return {
        loggedInUser,
      };
    },
  },
});

const app = express();
app.use(graphqlUploadExpress()); // 추가
app.use(logger("tiny"));
apollo.applyMiddleware({ app });
app.use("/static", express.static("uploads"));

const httpServer = http.createServer(app);
apollo.installSubscriptionHandlers(httpServer);

httpServer.listen(PORT, () => {
  console.log(` 🌱🌹  "화목" Server is running on HEROKU 🌿🌹 `);
});

// app.listen({ port: PORT }, () => {
//   console.log(` 🌗  Server is running on http://localhost:${PORT}/ 🌗  `);
// });

// .then(() =>
//   console.log(` 🌗  Server is running on http://localhost:${PORT}/`)
// );
