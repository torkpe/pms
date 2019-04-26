const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');

admin.initializeApp(functions.config().firebase);

const app = express();
app.use(bodyParser.json())

app.post('/v1/locations', (request, response) => {
  const {
    location,
    numberOfMaleResidents,
    numberOfFemaleResidents
  } = request.body
  const regEx = /^\d+$/;
  if (!location || !location.trim()) {
    return response.status(400).send({ response: 'Invalid location name' });
  }
  if (!numberOfFemaleResidents || !numberOfFemaleResidents.trim() || !regEx.test(numberOfFemaleResidents)) {
    return response.status(400).send({ response: 'Invalid number of female residents' });
  }
  if (!numberOfMaleResidents || !numberOfMaleResidents.trim() || !regEx.test(numberOfMaleResidents)) {
    return response.status(400).send({ response: 'Invalid number of male residents' });
  }

  admin.database().ref('locations').push({
    location,
    numberOfFemaleResidents,
    numberOfMaleResidents
  })
  .then(() => response.status(201).send({ response: 'Location added successfully' }))
});

app.get('/v1/locations', (request, response) => {
  admin.database().ref('locations').once('value')
    .then((locations) => {
      const arrayOfLocations = [];
      locations.forEach((location) => {
        if (!location.val().isDeleted) {
          const generatedLocation = location.val()
          generatedLocation.key = location.key
          generatedLocation.totalResidents =
            parseInt(generatedLocation.numberOfFemaleResidents, 10) +
            parseInt(generatedLocation.numberOfMaleResidents, 10);
          arrayOfLocations.push(generatedLocation);
        }
      });
      response.status(200).send({ response: arrayOfLocations.length ? arrayOfLocations : 'No location at this time' })
    });
});

app.put('/v1/locations/:locationKey/update', (request, response) => {
  const {
    location: locationPayload,
    numberOfMaleResidents,
    numberOfFemaleResidents
  } = request.body;
  if(numberOfFemaleResidents && parseInt(numberOfFemaleResidents, 10) < 0) {
    return response.status(400).send({ response: 'Number of female residents should be greater than or equal zero' })
  }
  if(numberOfMaleResidents && parseInt(numberOfMaleResidents, 10) < 0) {
    return response.status(400).send({ response: 'Number of male residents should be greater than or equal zero' })
  }
  admin.database().ref(`locations/${request.params.locationKey}`).once('value')
  .then((location) => {
    if (Object.keys(location.val()).length < 1 || location.val().isDeleted) {
      response.status(404).send({ response: 'Cannot find location' })
    } else {
      const locationData = location.val();
      admin.database().ref(`locations/${request.params.locationKey}`).update({
        location: locationPayload ? locationPayload : locationData.location,
        numberOfMaleResidents: numberOfMaleResidents ?
          numberOfMaleResidents : locationData.numberOfMaleResidents,
        numberOfFemaleResidents: numberOfFemaleResidents
          ? numberOfFemaleResidents : locationData.numberOfFemaleResidents
      }).then(()=> {
        response.status(200).send({ response: 'Location update successfully'})
      });
    }
  })
});

app.put('/v1/locations/:locationKey/sub-location', (request, response) => {
  const {
    location: locationPayload,
    numberOfMaleResidents,
    numberOfFemaleResidents
  } = request.body;
  const regEx = /^\d+$/;
  if (!locationPayload || !locationPayload.trim()) {
    return response.status(400).send({ response: 'Invalid location name' });
  }
  if (!numberOfFemaleResidents || !numberOfFemaleResidents.trim() || !regEx.test(numberOfFemaleResidents)) {
    return response.status(400).send({ response: 'Invalid number of female residents' });
  }
  if (!numberOfMaleResidents || !numberOfMaleResidents.trim() || !regEx.test(numberOfMaleResidents)) {
    return response.status(400).send({ response: 'Invalid number of male residents' });
  }

  admin.database().ref(`locations/${request.params.locationKey}`).once('value')
  .then((location) => {
    if (Object.keys(location.val()).length < 1 || location.val().isDeleted) {
      response.status(404).send({ response: 'Cannot find lcation' })
    } else {
      admin.database().ref(`locations/${request.params.locationKey}/subLocations`).push({
        location: locationPayload,
        numberOfMaleResidents,
        numberOfFemaleResidents
      }).then(()=> {
        response.status(200).send({ response: 'Sub location update successfully'})
      })
    }
  });
});

app.get('/v1/locations/:locationKey', (request, response) => {
  admin.database().ref(`locations/${request.params.locationKey}`).once('value')
  .then((location) => {
    if (Object.keys(location.val()).length < 1 || location.val().isDeleted) {
      response.status(404).send({ response: 'Cannot find location' })
    } else {
      response.status(200).send({ response: location.val() });
    }
  });
})

app.delete('/v1/locations/:locationKey/delete', (request, response) => {
  admin.database().ref(`locations/${request.params.locationKey}`).once('value')
    .then((location) => {
      if (Object.keys(location.val()).length < 1 || location.val().isDeleted) {
        response.status(404).send({ response: 'Cannot find location' })
      } else {
      admin.database().ref(`locations/${request.params.locationKey}`).update({
        isDeleted: true
      }).then(()=> {
        response.status(200).send({ response: 'Location deleted successfully'})
      });
    }
  });
});

app.get('/v1/locations/:locationKey/sub-location', (request, response) => {
  admin.database().ref(`locations/${request.params.locationKey}`).once('value')
    .then((location) => {
      if (Object.keys(location.val()).length < 1 || location.val().isDeleted) {
        response.status(404).send({ response: 'Cannot find location' })
      } else {
        admin.database().ref(`locations/${request.params.locationKey}/subLocations`).once('value')
        .then((locations) => {
          const arrayOfLocations = [];
          locations.forEach((location) => {
            if (!location.val().isDeleted) {
              const generatedLocation = location.val()
              generatedLocation.key = location.key
              generatedLocation.totalResidents =
                parseInt(generatedLocation.numberOfFemaleResidents, 10) +
                parseInt(generatedLocation.numberOfMaleResidents, 10);
              arrayOfLocations.push(generatedLocation);
            }
          });
          if (!arrayOfLocations.length) {
            return response.status(404).send({ response: 'No sub location at this moment' })
          }
          response.status(200).send({ response: arrayOfLocations })
        });
      }
    })
});

app.get('*', (request, response) => {
  response.status(200).send({message: 'welcome to the PMS app'})
})

const pms = functions.https.onRequest(app);

module.exports = {
  pms
}
