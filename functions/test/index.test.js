const test = require('firebase-functions-test')({
  databaseURL: 'https://theshop-4a155.firebaseio.com',
  storageBucket: 'theshop-4a155.appspot.com',
  projectId: 'theshop-4a155',
}, './test/account-key.json');
const admin = require('firebase-admin');

const request = require('supertest');
const expect = require('chai').expect;
const myFunctions = require('./../index.js');


describe('locations', () => {
  before(() => {
    admin.database().ref().remove();
  });

  it('should get the welcome message', (done) => {
    request((myFunctions.pms))
    .get('/v1/')
    .expect(200)
    .end((error, response) => {
      if (error) {
        return done(error)
      }
      expect(response.body).property('message')
      expect(response.body.message).equal('welcome to the PMS app')
      done();
    });
  });

  describe('/v1/locations', () => {
    it('should get the no lcations message', (done) => {
      request((myFunctions.pms))
      .get('/v1/locations')
      .expect(200)
      .end((error, response) => {
        if (error) {
          return done(error)
        }
        expect(response.body).property('response')
        expect(response.body.response).equal('No location at this time')
        done();
      });
    });
  });

  describe('/v1/locations', () => {
    let createdLocation;

    it('should respond with an error message when numberOfFemaleResidents is invalid', (done) => {
      request((myFunctions.pms))
      .post('/v1/locations')
      .send({
        numberOfFemaleResidents: null,
        numberOfMaleResidents: '1',
        location: 'lagos'
      })
      .expect(400)
      .end((error, response) => {
        if (error) {
          return done(error)
        }
        expect(response.body).property('response')
        expect(response.body.response).equal('Invalid number of female residents')
        done();
      });
    });

    it('should respond with an error message when numberOfMaleResidents is invalid', (done) => {
      request((myFunctions.pms))
      .post('/v1/locations')
      .send({
        numberOfFemaleResidents: '1',
        numberOfMaleResidents: null,
        location: 'lagos'
      })
      .expect(400)
      .end((error, response) => {
        if (error) {
          return done(error)
        }
        expect(response.body).property('response')
        expect(response.body.response).equal('Invalid number of male residents')
        done();
      });
    });
  
    it('should respond with an error message when location is invalid', (done) => {
      request((myFunctions.pms))
      .post('/v1/locations')
      .send({
        numberOfFemaleResidents: '1',
        numberOfMaleResidents: '10',
        location: ''
      })
      .expect(400)
      .end((error, response) => {
        if (error) {
          return done(error)
        }
        expect(response.body).property('response')
        expect(response.body.response).equal('Invalid location name')
        done();
      });
    });

    it('should create location with valid details', (done) => {
      request((myFunctions.pms))
      .post('/v1/locations')
      .send({
        numberOfFemaleResidents: '1',
        numberOfMaleResidents: '10',
        location: 'lagos'
      })
      .expect(201)
      .end((error, response) => {
        if (error) {
          return done(error)
        }
        expect(response.body).property('response')
        expect(response.body.response).equal('Location added successfully')
        done();
      });
    });

    it('should get all locations', (done) => {
      request((myFunctions.pms))
      .get('/v1/locations')
      .expect(200)
      .end((error, response) => {
        if (error) {
          return done(error)
        }
        createdLocation = response.body.response[0];
        expect(response.body).property('response')
        expect(response.body.response.length).equal(1)
        expect(createdLocation).property('key');
        expect(createdLocation.totalResidents).equal(11);
        done();
      });
    });

    it('should update location', (done) => {
      request((myFunctions.pms))
      .put(`/v1/locations/${createdLocation.key}/update`)
      .send({
        location: 'Abuja'
      })
      .expect(200)
      .end((error, response) => {
        if (error) {
          return done(error)
        }
        expect(response.body).property('response');
        expect(response.body.response).equal('Location update successfully');
        done();
      });
    });

    describe('/sub-location', () => {
      it('should get sub location', (done) => {
        request((myFunctions.pms))
        .get(`/v1/locations/${createdLocation.key}/sub-location`)
        .end((error, response) => {
          if (error) {
            return done(error)
          }
          expect(response.body).property('response');
          expect(response.body.response).equal('No sub location at this moment');
          done();
        });
      });

      it('should add sub location', (done) => {
        request((myFunctions.pms))
        .put(`/v1/locations/${createdLocation.key}/sub-location`)
        .send({
          numberOfFemaleResidents: '1',
          numberOfMaleResidents: '0',
          location: 'lagos'
        })
        .expect(200)
        .end((error, response) => {
          if (error) {
            return done(error)
          }
          expect(response.body).property('response');
          expect(response.body.response).equal('Sub location update successfully');
          done();
        });
      });

      it('should return error invalid numberOfFemaleResidents', (done) => {
        request((myFunctions.pms))
        .put(`/v1/locations/${createdLocation.key}/sub-location`)
        .send({
          numberOfFemaleResidents: null,
          numberOfMaleResidents: '0',
          location: 'lagos'
        })
        .expect(400)
        .end((error, response) => {
          if (error) {
            return done(error)
          }
          expect(response.body).property('response');
          expect(response.body.response).equal('Invalid number of female residents');
          done();
        });
      });

      it('should return error invalid numberOfMaleResidents', (done) => {
        request((myFunctions.pms))
        .put(`/v1/locations/${createdLocation.key}/sub-location`)
        .send({
          numberOfFemaleResidents: '0',
          numberOfMaleResidents: null,
          location: 'lagos'
        })
        .expect(400)
        .end((error, response) => {
          if (error) {
            return done(error)
          }
          expect(response.body).property('response');
          expect(response.body.response).equal('Invalid number of male residents');
          done();
        });
      });
  
      it('should return error invalid location', (done) => {
        request((myFunctions.pms))
        .put(`/v1/locations/${createdLocation.key}/sub-location`)
        .send({
          numberOfFemaleResidents: '0',
          numberOfMaleResidents: '10',
          location: null
        })
        .expect(400)
        .end((error, response) => {
          if (error) {
            return done(error)
          }
          expect(response.body).property('response');
          expect(response.body.response).equal('Invalid location name');
          done();
        });
      });

      it('should get sub location', (done) => {
        request((myFunctions.pms))
        .get(`/v1/locations/${createdLocation.key}/sub-location`)
        .expect(200)
        .end((error, response) => {
          if (error) {
            return done(error)
          }
          expect(response.body).property('response');
          expect(response.body.response.length).equal(1);
          expect(response.body.response[0].location).equal('lagos');
          done();
        });
      });

      it('should delete location', (done) => {
        request((myFunctions.pms))
        .delete(`/v1/locations/${createdLocation.key}/delete`)
        .expect(200)
        .end((error, response) => {
          if (error) {
            return done(error)
          }
          expect(response.body).property('response');
          expect(response.body.response).equal('Location deleted successfully');
          done();
        });
      });

      it('should not find non-existing location', (done) => {
        request((myFunctions.pms))
        .get(`/v1/locations/${createdLocation.key}`)
        .expect(404)
        .end((error, response) => {
          if (error) {
            return done(error)
          }
          expect(response.body).property('response');
          expect(response.body.response).equal('Cannot find location');
          done();
        });
      });
      it('should not delete non-existing location', (done) => {
        request((myFunctions.pms))
        .delete(`/v1/locations/${createdLocation.key}/delete`)
        .expect(404)
        .end((error, response) => {
          if (error) {
            return done(error)
          }
          expect(response.body).property('response');
          expect(response.body.response).equal('Cannot find location');
          done();
        });
      });
    })
  });
});
