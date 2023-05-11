import puppeteer from "puppeteer";
import Airtable from "airtable";
import * as dotenv from "dotenv";

dotenv.config();

const { API_KEY, BASE_ID } = process.env;

const base = new Airtable({ apiKey: API_KEY }).base(BASE_ID);

const table = base("Jobs");

let offerTab = [];

const getJobOffers = async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(
    `https://www.welcometothejungle.com/fr/stacks?page=1&refinementList%5Btools.frontend%5D%5B%5D=React%20JS`,
    { waitUntil: "networkidle2" }
  );

  const max = await page.evaluate(() => {
    return Number(
      document.querySelector(
        "[data-testid='stacks-search-pagination'] li:nth-last-child(2)"
      ).innerText
    );
  });

  for (let i = 0; i < max; i++) {
    await page.waitForSelector("#job-search-results");
    console.log(i);

    const offers = await page.evaluate(() => {
      return [
        ...document.querySelectorAll(
          "#job-search-results .ais-Hits-list-item a"
        ),
      ].map((elem) => {
        return {
          name: elem.querySelector("h3").innerText,
          description: elem.querySelector("span:nth-child(2)").innerText,
          logo: elem.querySelector("header img").getAttribute("src"),
          link:
            "https://www.welcometothejungle.com" + elem.getAttribute("href"),
        };
      });
    });

    console.log(offers[offers.length - 1]);

    offerTab = [...offerTab, offers];

    if (i < max - 1) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click("[aria-label='Pagination'] li:nth-last-child(1) a"),
      ]);
    }
  }

  offerTab = offerTab.concat.apply([], offerTab).flat();

  getMoreAboutOffers(0);

  await browser.close();
};

getJobOffers();

const getMoreAboutOffers = async (index) => {
  if (index < offerTab.length) {
    table
      .select({
        filterByFormula: `{link} = '${offerTab[index].link}'`,
        maxRecords: 1,
      })
      .firstPage(async function (err, records) {
        if (err) {
          console.error(err);
          return;
        }

        if (records.length > 0) {
          const companyName = offerTab[index].link.replace(
            "https://www.welcometothejungle.com/fr/companies/",
            ""
          );

          const realName = companyName.split("/")[0];

          console.log(`The element '${realName}' exists in the table.`);
        } else {
          const browser = await puppeteer.launch({ headless: "new" });
          const page = await browser.newPage();

          await page.goto(offerTab[index].link, {
            waitUntil: "networkidle2",
          });

          const networks = await page.evaluate(() => {
            return [
              ...document.querySelectorAll(
                "[data-testid='organization-content-block-social-networks'] a"
              ),
            ].map((elem) => {
              const name = elem.querySelector("i").getAttribute("name");
              const url = elem.getAttribute("href");
              return { name, url };
            });
          });

          const objNetworks = networks.reduce((acc, curr) => {
            acc[curr.name] = curr.url;
            return acc;
          }, {});

          const website = await page.evaluate(() => {
            return document
              .querySelector("[data-testid='organization-cover-metas'] a")
              ?.getAttribute("href");
          });

          const city = await page.evaluate(() => {
            return document.querySelector(
              "[data-testid='organization-cover-metas'] li:nth-child(2) span:nth-child(2)"
            ).innerText;
          });

          const { name, description, logo, link } = offerTab[index];

          base("Jobs").create(
            {
              name,
              description,
              logo,
              link,
              website,
              city,
              linkedin: objNetworks.linkedin,
              instagram: objNetworks?.instagram,
              twitter: objNetworks?.twitter,
              youtube: objNetworks?.youtube,
              facebook: objNetworks?.facebook,
            },
            function (err) {
              if (err) {
                console.error(err);
                return;
              }
              console.log("Created", name);
            }
          );

          await browser.close();
        }
        index++;
        getMoreAboutOffers(index);
      });
  }
};
