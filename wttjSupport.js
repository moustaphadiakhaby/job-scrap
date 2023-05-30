import data from "./data/entreprises.json" assert { type: "json" };
import fs from "fs";

const saveToFile = (data) => {
  fs.writeFile("./data/wttja.json", JSON.stringify(data), "utf8", (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("scraping success");
    }
  });
};

const allGet = async () => {
  let newData = [];
  data.map((elem) => {
    const {
      name,
      description,
      link,
      website,
      city,
      linkedin,
      facebook,
      instagram,
      youtube,
      twitter,
      logo,
    } = elem;

    const obj = {
      name,
      description,
      city,
      link,
      website,
      logo,
      linkedin,
      twitter,
      facebook,
      instagram,
      youtube,
    };

    elem.networks.map((e) => {
      obj[e.name] = e.url;
    });

    newData.push(obj);
  });

  saveToFile(newData);
};

allGet();
