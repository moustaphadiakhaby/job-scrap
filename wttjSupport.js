import data from "./data/wttj.json" assert { type: "json" };
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
      networks: [
        { name: "linkedin", url: linkedin },
        { name: "twitter", url: twitter },
        { name: "facebook", url: facebook },
        { name: "instagram", url: instagram },
        { name: "youtube", url: youtube },
      ],
    };

    const newObj = obj.networks.filter((elem) => {
      if (elem.url) {
        return elem;
      }
    });

    obj.networks = newObj;

    newData.push(obj);
  });

  saveToFile(newData);
};

allGet();
