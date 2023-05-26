import puppeteer from "puppeteer";
import fs from "fs";
import dayjs from "dayjs";
import data from "./data/allocine/directors.json" assert { type: "json" };

const saveToFile = (data) => {
  fs.writeFile(
    "./data/newdirectors.json",
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

let moviesTab = [];

const getLinks = async () => {
  for (let i = 1; i <= 30; i++) {
    try {
      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
      if (i < 2) {
        await page.goto("https://www.allocine.fr/film/meilleurs/", {
          waitUntil: "networkidle2",
        });
      } else {
        await page.goto(`https://www.allocine.fr/film/meilleurs/?page=${i}`, {
          waitUntil: "networkidle2",
        });
      }

      await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
          let totalHeight = 0;
          const distance = 1000;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });

      const movies = await page.evaluate(() => {
        const round = (number) => {
          const roundedNumber = Math.floor(number * 2) / 2;
          return roundedNumber;
        };

        const convertDuration = (duration) => {
          const [hours, minutes] = duration.split(" ");
          const hoursNum = Number(hours.replace("h", ""));
          const minutesNum = Number(minutes.replace("min", ""));

          const totalMinutes = hoursNum * 60 + minutesNum;
          return totalMinutes;
        };

        return [...document.querySelectorAll(".mdl")].map((elem) => {
          const months = [
            "janvier",
            "février",
            "mars",
            "avril",
            "mai",
            "juin",
            "juillet",
            "août",
            "septembre",
            "octobre",
            "novembre",
            "décembre",
          ];

          const title = elem.querySelector("h2").innerText;
          const image = elem.querySelector("figure img").getAttribute("src");
          //   const infos = elem.querySelector(".meta-body-info").innerText;

          //   const month = infos.split(" / ")[0].split(" ")[1];

          //   const trueDate = infos
          //     .split(" / ")[0]
          //     .replaceAll(" ", "-")
          //     .replace(months[months.indexOf(month)], months.indexOf(month) + 1)
          //     .split("-");

          //   const releaseDate = trueDate[2] + "-" + trueDate[1] + "-" + trueDate[0];

          //   // const duration = convertDuration(infos.split(" / ")[1]);
          //   const genres = infos.split(" / ")[2];

          const directors = [
            ...elem.querySelectorAll(".meta-body-direction a"),
          ].map((elem) => {
            return {
              name: elem.innerText,
              link: "https://www.allocine.fr" + elem.getAttribute("href"),
            };
          });

          const actors = [...elem.querySelectorAll(".meta-body-actor a")].map(
            (elem) => {
              const name = elem.innerText;
              const link =
                "https://www.allocine.fr" + elem.getAttribute("href");
              return { name, link };
            }
          );

          const link =
            "https://www.allocine.fr" +
            elem.querySelector("h2 a").getAttribute("href");

          const ratingTab = [
            Number(
              elem.querySelector(".stareval-note").innerText.replace(",", ".")
            ),
            Number(
              elem
                .querySelector(".rating-item:nth-child(2) .stareval-note")
                .innerText.replace(",", ".")
            ),
          ];

          const rating = {
            spectators: ratingTab[1] ? ratingTab[1] : ratingTab[0],
            press: ratingTab[1] && ratingTab[0],
          };

          return {
            title,
            image,
            directors,
            actors,
            link,
            rating,
          };
        });
      });

      moviesTab.push(movies);

      //   movies.forEach((movie) => {
      //     console.log(movie.releaseDate);
      //     return (movie.releaseDate = dayjs(movie.releaseDate).format());
      //   });
      await browser.close();
    } catch (error) {
      console.log(i);
    }
  }

  const cut = moviesTab.concat.apply([], moviesTab).flat();
  saveToFile(cut);
};

// getLinks();

const getMoreDetails = async (data) => {
  let newData = [];
  for (let i = 0; i < data.length; i++) {
    try {
      const actor = data[i];
      const convertDuration = (duration) => {
        const [hours, minutes] = duration.split(" ");
        const hoursNum = Number(hours.replace("h", ""));
        const minutesNum = Number(minutes.replace("min", ""));

        const totalMinutes = hoursNum * 60 + minutesNum;
        return totalMinutes;
      };

      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();

      await page.goto(actor.link, {
        waitUntil: "networkidle2",
      });

      //   const infos = elem.querySelector(".meta-body-info").innerText;

      //   const month = infos.split(" / ")[0].split(" ")[1];

      //   const trueDate = infos
      //     .split(" / ")[0]
      //     .replaceAll(" ", "-")
      //     .replace(months[months.indexOf(month)], months.indexOf(month) + 1)
      //     .split("-");

      //   const releaseDate = trueDate[2] + "-" + trueDate[1] + "-" + trueDate[0];

      //   // const duration = convertDuration(infos.split(" / ")[1]);
      //   const genres = infos.split(" / ")[2];

      const releaseYear = await page.evaluate(() => {
        const infos = document.querySelector(".meta-body-info .date").innerText;

        return Number(infos.split(" ")[2]);
      });

      const synopsis = await page.evaluate(() => {
        return document.querySelector(".content-txt ").innerText;
      });

      const minutes = await page.evaluate(() => {
        return document
          .querySelector(".meta-body-info")
          .innerText.split(" / ")[1];
      });

      const duration = `${convertDuration(minutes)} minutes`;

      const { title, image, directors, actors, link, rating } = actor;

      const obj = {
        title,
        poster: image,
        releaseYear,
        duration,
        synopsis,
        directors,
        actors,
        rating,
        link,
      };

      newData.push(obj);

      console.log("success", i);

      await browser.close();
    } catch (error) {
      console.log(error.message, i);
    }
  }

  const cut = newData.concat.apply([], newData).flat();

  saveToFile(cut);
};
// 124, 127
// getMoreDetails(data);

const getActors = async (data) => {
  let newData = [];
  for (let i = 0; i < data.length; i++) {
    try {
      const actor = data[i];
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();

      await page.goto(actor.link, {
        waitUntil: "networkidle2",
      });

      const picture = await page.evaluate(() => {
        return (
          document.querySelector(".card figure img") &&
          document.querySelector(".card figure img").getAttribute("src")
        );
      });

      const infos = await page.evaluate(() => {
        const infos = [
          ...document.querySelectorAll(".person-card-overview .meta-body-item"),
        ].map((elem) => {
          const key = elem.querySelector("span").innerText.trim();

          if (key === "Métiers") {
            const texts = [...elem.querySelectorAll("strong")].map((elem) => {
              return elem.innerText;
            });

            const final = texts.join("").trim();
            return { jobs: final };
          }

          if (key === "Nationalité" || key === "Nationalités") {
            return {
              nationality: elem.innerText.split(" ").slice(1).join(" "),
            };
          }

          if (key === "Naissance") {
            return {
              yearOfBirth: Number(
                elem.querySelector("strong").innerText.split(" ")[2]
              ),
            };
          }
        });

        return infos;
      });

      const { name } = actor;

      const obj = {
        name,
        picture,
      };

      const filteredInfos = infos.filter((elem) => {
        return elem !== null;
      });

      filteredInfos.map((elem) => {
        obj[Object.keys(elem)] = Object.values(elem)[0];
      });
      console.log(obj);

      newData.push(obj);

      console.log("success", i);

      await browser.close();
    } catch (error) {
      console.log(error.message, i);
    }
  }

  const cut = newData.concat.apply([], newData).flat();

  saveToFile(cut);
};

getActors(data);
