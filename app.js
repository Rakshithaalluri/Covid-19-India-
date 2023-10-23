const express = require("express");
const path = require("path");
const app = express();

const dbPath = path.join(__dirname, "covid19India.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(2375, () => {
      console.log("Server is running at http://localhost:2375/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// API 1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
        state_id AS stateId,
        state_name AS stateName,
        population AS population
    FROM 
       state`;

  const dbResponse = await db.all(getStatesQuery);
  console.log(dbResponse);
  response.send(dbResponse);
});

//API2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
       state_id AS stateId,
        state_name AS stateName,
        population AS population
     FROM state
    WHERE state_id = ${stateId}`;

  const getStateResponse = await db.get(getStateQuery);
  console.log(getStateResponse);
  response.send(getStateResponse);
});
//API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const districtQuery = `
     INSERT INTO 
     district (district_name, state_id, cases, cured, active,deaths)
     VALUES (
         '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
         ${deaths}
     )`;
  const districtResponse = await db.run(districtQuery);
  const districtId = districtQuery.lastID;
  console.log(districtQuery);
  response.send("District Successfully Added");
});

//API4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
      district_id AS districtId,
      district_name AS districtName,
      state_id AS stateId,
      cases AS cases,
      cured AS cured,
      active AS active,
      deaths AS deaths
    FROM district
    WHERE district_id = ${districtId}`;

  const getDistrictResponse = await db.get(getDistrictQuery);
  console.log(getDistrictResponse);
  response.send(getDistrictResponse);
});

//API5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
     DELETE FROM district
     WHERE 
     district_id = ${districtId}
       `;

  const dbResponse = await db.run(deleteDistrictQuery);
  console.log(dbResponse);
  response.send("District Removed");
});

//API6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const getDistrictQuery = `
    UPDATE district
    SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}

    WHERE district_id = ${districtId}`;

  const getDistrictResponse = await db.get(getDistrictQuery);
  console.log(getDistrictResponse);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT 
       SUM(cases),
       SUM(cured),
       SUM(active),
       SUM(deaths)

     FROM district
    WHERE state_id = ${stateId}`;

  const stats = await db.get(getStateStatsQuery);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    `; //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    `; //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
}); //sending the required response

module.exports = app;
