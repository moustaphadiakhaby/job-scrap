import data from "./data/allocine/movies.json" assert { type: "json" };
import fs from "fs";

const saveToFile = (data) => {
  fs.writeFile(
    "./data/allocine/actors.json",
    JSON.stringify(data),
    "utf8",
    (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("scraping success");
      }
    }
  );
};

let actors = [];

for (let i = 0; i < data.length; i++) {
  const elem = data[i];

  elem.actors.map((actor) => {
    const result = actors.find((ac) => {
      return ac.link === actor.link;
    });

    console.log(result);

    if (!result) {
      actors.push(actor);
    }
  });
}

saveToFile(actors);
