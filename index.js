const express = require("express");
const graphqlHTTP = require("express-graphql");
const { buildSchema } = require("graphql");
const axios = require("axios");
const cors = require("cors");

const app = express();

const schema = buildSchema(`
  type Pokemon {
    id: Int
    name: String
    abilities: [String]
    types: [String]
    image: String
    gender: String
  }

  type Query {
    getAllPokemon: [Pokemon]
    getPokemonByName(name: String!): Pokemon
  }
`);

const root = {
  getAllPokemon: async () => {
    let temp = [];
    let offset;
    let limit = 200;
    let url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;

    let getPokemonList = async function() {
      try {
        await axios.get(url).then(async res => {
          await res.data.results.map(async pokemon =>
            temp.push(await root.getPokemonByName(pokemon))
          );

          if (res.data.next) {
            url = res.data.next;
            await getPokemonList(url);
          }
        });
      } catch (error) {
        console.log(error);
      }
    };

    await getPokemonList();

    return temp;
  },
  getPokemonByName: async ({ name }) => {
    return await axios
      .get(`https://pokeapi.co/api/v2/pokemon/${name}`)
      .then(res => {
        let temp = {
          id: res.data.id,
          name: res.data.name,
          image: res.data.sprites.front_default,
          abilities: res.data.abilities.map(
            abilityItem => abilityItem.ability.name
          ),
          types: res.data.types.map(typeItem => typeItem.type.name)
        };

        return temp;
      });
  }
};

app.use(cors());
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
  })
);

app.listen(8080, () => console.log("app running in port 8080"));
