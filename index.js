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
    height: Int
    weight: Int
    abilities: [String]
    types: [String]
    image: String
    species: String
    gender: String
  }

  type Query {
    getAllPokemon: [Pokemon]
    getPokemonByName(name: String): Pokemon
  }
`);

const root = {
  getAllPokemon: async () => {
    let temp = [];

    let url = `https://pokeapi.co/api/v2/pokemon?offset=0&limit=20`;

    await axios.get(url).then(res => {
      res.data.results.map(pokemon =>
        temp.push(root.getPokemonByName(pokemon))
      );
    });

    return temp;
  },
  getPokemonByName: async ({ name }) => {
    return await axios
      .get(`https://pokeapi.co/api/v2/pokemon/${name}`)
      .then(res => {
        let temp = {
          id: res.data.id,
          name: res.data.name,
          height: res.data.height,
          weight: res.data.weight,
          image: res.data.sprites.front_default,
          species: res.data.species.name,
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
