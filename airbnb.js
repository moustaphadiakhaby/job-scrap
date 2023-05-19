import puppeteer from "puppeteer";
import fs from "fs";
// import data from "./data/airbnb.json" assert { type: "json" };
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { faker } from "@faker-js/faker";

const saveToFile = (data) => {
  fs.writeFile("./data/airbnb.json", JSON.stringify(data), "utf8", (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("scraping success");
    }
  });
};

let tabLinks = [];
let roomsTab = [];

const getLinks = async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(
    "https://www.airbnb.fr/s/Lyon/homes?flexible_trip_lengths%5B%5D=one_week&monthly_start_date=2023-06-01&monthly_length=3&date_picker_type=calendar&refinement_paths%5B%5D=%2Fhomes&source=structured_search_input_header&search_type=autocomplete_click&tab_id=home_tab&price_filter_input_type=0&price_filter_num_nights=5&channel=EXPLORE&zoom_level=15&query=Lyon%2C%20France&place_id=ChIJl4foalHq9EcR8CG75CqrCAQ",
    {
      waitUntil: "networkidle2",
    }
  );

  await page.setViewport({ width: 1920, height: 1080 });
  await page.screenshot({ path: `fullpage-${nanoid(3)}.png`, fullPage: true });

  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = 80;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight / 1.25;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 80);
    });
  });

  const links = await page.evaluate(() => {
    return [...document.querySelectorAll("[itemprop='itemListElement']")]
      .map((elem) => {
        if (elem.querySelector("[aria-label='Aperçu hôte']")) {
          return (
            "https://www.airbnb.fr" +
            elem.querySelector("a").getAttribute("href")
          );
        }
      })
      .filter((elem) => {
        if (elem !== null) return elem;
      });
  });

  console.log(links.length);

  tabLinks = links;

  getRooms(0);

  await browser.close();
};

getLinks();

const getRooms = async (index) => {
  if (index < 10) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(tabLinks[index], {
      waitUntil: "networkidle2",
    });
    // await page.goto(
    //   "https://www.airbnb.fr/rooms/3846479?adults=1&category_tag=Tag%3A8678&children=0&enable_m3_private_room=true&infants=0&pets=0&check_in=2023-06-03&check_out=2023-06-10&federated_search_id=7f364334-4035-4206-81cc-f03a5e8aabd1&source_impression_id=p3_1684332833_82N%2B0IpCBaqZfP1a",
    //   {
    //     waitUntil: "networkidle2",
    //   }
    // );

    await page.waitForSelector("[data-section-id='LOCATION_DEFAULT']");

    const elementExists =
      (await page.$('[aria-label="Traduction activée"]')) !== null;

    if (elementExists) {
      await page.click("[aria-label='Traduction activée'] button");
    } else {
      console.log("Element not found.");
    }

    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        let totalHeight = 0;
        const distance = 100;
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

    const title = await page.evaluate(() => {
      return document.querySelector("h1").innerText;
    });

    const price = await page.evaluate(() => {
      return Number(
        document
          .querySelector("[data-testid='book-it-default'] div div span span")
          .textContent.split("€")[0]
          .trim()
      );
    });

    const round = (number) => {
      const roundedNumber = Math.floor(number * 2) / 2;
      return roundedNumber;
    };

    const stars = await page.evaluate(() => {
      const round = (number) => {
        const roundedNumber = Math.floor(number * 2) / 2;
        return roundedNumber;
      };
      return document.querySelector(
        "[data-testid='book-it-default'] div div:nth-child(2) span:nth-child(2)"
      )
        ? round(
            Number(
              document
                .querySelector(
                  "[data-testid='book-it-default'] div div:nth-child(2) span:nth-child(2)"
                )
                .innerText.split(" ")[0]
                .replace(",", ".")
            )
          )
        : null;
    });
    const description = await page.evaluate(() => {
      return document
        .querySelector("[data-section-id='DESCRIPTION_DEFAULT'] span")
        .innerText.split("\n")[0];
    });

    const userDetails = await page.evaluate(() => {
      return [
        ...document.querySelectorAll(
          "[data-section-id='MEET_YOUR_HOST'] section div:nth-child(2) span"
        ),
      ]
        .map((elem) => {
          return elem.innerText.replace(",", ".");
        })
        .filter((elem) => {
          if (!isNaN(elem)) {
            return elem;
          }
        })
        .map((elem) => {
          return Number(elem);
        });
    });

    const images = await page.evaluate(() => {
      return [
        ...document.querySelectorAll(
          "[data-section-id='HERO_DEFAULT'] picture img"
        ),
      ].map((elem) => {
        return elem.getAttribute("src");
      });
    });

    const avatar = await page.evaluate(() => {
      return (
        document.querySelector("[data-section-id='LISTING_INFO'] img") &&
        document
          .querySelector("[data-section-id='LISTING_INFO'] img")
          .getAttribute("src")
      );
    });

    await page.waitForSelector("[data-section-id='LOCATION_DEFAULT'] a");

    const location = await page.evaluate(() => {
      if (document.querySelector("[data-section-id='LOCATION_DEFAULT'] a")) {
        const coords = document
          .querySelector("[data-section-id='LOCATION_DEFAULT'] a")
          .getAttribute("href");

        return coords.split("ll=")[1].split("&")[0].split(",");
      }
    });

    const name = await page.evaluate(() => {
      return document.querySelector(
        "[data-section-id='MEET_YOUR_HOST'] div:nth-child(2) h3"
      ).innerText;
    });

    const attributes = await page.evaluate(() => {
      return [
        ...document.querySelectorAll("[data-section-id='LISTING_INFO'] li"),
      ].map((elem) => {
        return {
          svg: elem.querySelector("path").getAttribute("d"),
          title: elem.querySelector("div:nth-child(2)").innerText,
        };
      });
    });

    const features = await page.evaluate(() => {
      return [
        ...document.querySelectorAll(
          "[data-section-id='AMENITIES_DEFAULT'] section div:nth-child(3) div div"
        ),
      ]
        .map((elem) => {
          return {
            title:
              elem.querySelector("div") &&
              elem.querySelector("div").innerText.includes("Indisponible")
                ? elem
                    .querySelector("div")
                    .innerText.split("\n")[0]
                    .split(":")[1]
                    .trim()
                : elem.querySelector("div") &&
                  elem.querySelector("div").innerText,
            svg:
              elem.querySelector("path") &&
              elem.querySelector("path").getAttribute("d"),
            available:
              elem.querySelector("div") &&
              !elem.querySelector("div").innerText.includes("Indisponible"),
          };
        })
        .filter((elem) => {
          return elem.title !== null;
        });
    });

    const reviews = await page.evaluate(() => {
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

      return [
        ...document.querySelectorAll(
          "[data-section-id='REVIEWS_DEFAULT'] div:nth-child(3) [role='listitem']"
        ),
      ].map((elem) => {
        const splittedDate = elem.querySelector("li").innerText.split(" ");

        const realDate = `${splittedDate[1]}-${
          months.indexOf(splittedDate[0]) + 2
        }-01`;

        return {
          name: elem.querySelector("h3").innerText,
          avatar:
            elem.querySelector("img") &&
            elem.querySelector("img").getAttribute("src"),
          message: elem.querySelector("span").innerText,
          date: realDate,
        };
      });
    });

    reviews.forEach((elem) => {
      elem.date = dayjs(elem.date, "YYYY-MM-DD").$d;
      if (!elem.avatar) {
        elem.avatar = faker.image.avatar();
      }
    });

    // for (let i = 0; i < reviews.length; i++) {
    //   reviews[i].date = toDate(reviews[i].date);
    // }

    const rules = await page.evaluate(() => {
      return [
        ...document.querySelectorAll(
          "[data-section-id='POLICIES_DEFAULT'] div:nth-child(2) div:nth-child(1) div div div div div"
        ),
      ].map((elem) => {
        return elem.innerText;
      });
    });

    console.log(location, name);
    if (location) {
      const room = {
        title,
        description,
        price,
        location: {
          country: "France",
          city: "Lyon",
          lat: Number(location[0]),
          lng: Number(location[1]),
        },
        stars,
        images,
        rules,
        attributes,
        features,
        reviews,
        user: {
          name,
          avatar,
          reviews: userDetails[0],
          stars: round(userDetails[1]),
          experienceYear: userDetails[2],
        },
      };

      roomsTab.push(room);
    }

    await browser.close();

    index++;
    getRooms(index);
  } else {
    saveToFile(roomsTab);
  }
};

// getRooms();
