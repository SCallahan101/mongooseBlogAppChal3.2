'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const expect = chai.expect;

const testBlogApp = require ('./models');
const { app, runServer, closeServer} = require('./server');
const {TEST_DATABASE_URL} = require('./config');

chai.use(chaiHttp);

function seedBlogAppData() {
  console.info('seeding blog posts data');
  const seedPosts = [];

  for(let i = 0; i <=10; i++) {
    seedPosts.push(generateBlogPosts());
  }
  return testBlogApp.insertMany(seedPosts);
}

function generateTitleName() {
  const titles = ['Far away', 'Star Wars', 'Star Trek', 'Dead Sea', 'Stupid Bible'];
  return titles[Math.floor(Math.random() * titles.length)];
}

function generateContentStory() {
  const contents = ['Hello World 1', 'Hellow Underworld 1', 'Hello Heaven 1', 'Hello MoonBase 1'];
  return contents[Math.floor(Math.random() * contents.length)];
}

function generateAuthorName() {
  const authors = ['Tom', 'John', 'Mary', 'Julie', 'Jane', 'Kevin'];
  return authors[Math.floor(Math.random() * authors.length)];
}

function generateBlogPosts() {
  return {
    title: generateTitleName(),
    content: generateContentStory(),
    author: generateAuthorName()
  };
}

function slapShitOutDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('Blog Posts API resource', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });
  beforeEach(function() {
    return seedBlogAppData();
  });
  afterEach(function() {
    return slapShitOutDb();
  });
  after(function() {
    return closeServer();
  });

  describe('GET endpoint', function() {
    it('it should return all existing blog posts', function() {
      let res;
      return chai.request(app)
      .get('/posts')
      .then(function(_res) {
        res = _res;
        expect(res).to.have.status(200);
        expect(res.body.posts).to.have.lengthOf.at.least(1);
        return testBlogApp.count();
      })
      .then(function(count) {
        expect(res.body.posts).to.have.lengthOf(count);
      });
    });

    it('should return blog posts with right fields', function() {
      let resTestBlogPosts;
      return chai.request(app)
      .get('/posts')
      .then(function(res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.posts).to.be.a('array');
        expect(res.body.posts).to.have.lengthOf.at.least(1);

        res.body.posts.forEach(function(post) {
          expect(post).to.be.a('object');
          expect(post).to.include.keys('title', 'content', 'author');
        });
        resTestBlogPost = res.body.posts[0];
        return testBlogApp.findById(resBlogPost.id);
      })
      .then(function(post) {
        expect(resTestBlogPost.id).to.equal(post.id);
        expect(resTestBlogPost.title).to.equal(post.title);
        expect(resTestBlogPost.content).to.equal(post.content);
        expect(resTestBlogPost.author).to.equal(post.author);
      });
    });
  });
  describe('POST endpoint', function() {
    it('should add a new blog post', function() {
      const newTestBlogPost = generateBlogPosts();
      return chai.request(app)
      .post('/posts')
      .send(newTestBlogPost)
      .then(function(res) {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body).to.include.keys(
          'title', 'content', 'author'
        );
        expect(res.body.author).to.equal(newTestBlogPost.author);
        expect(res.body.title).to.equal(newTestBlogPost.title);
        expect(res.body.content).to.equal(newTestBlogPost.content);
        expect(res.body.id).to.not.be.null;
        return testBlogApp.findById(res.body.id);
      })
      .then(function(blogPost) {
        expect(blogPost.author).to.equal(newTestBlogPost.author);
        expect(blogPost.title).to.equal(newTestBlogPost.title);
        expect(blogPost.content).to.equal(newTestBlogPost.content);
      });
    });
  });
  describe('PUT endpoint', function() {
    it('should update fields you send over', function() {
      const updatePost = {
        author: "Tom Adams",
        title: "Greedy Sea"
      };
      return testBlogApp
      .findOne()
      .then(function(blogPost) {
        updatePost.id = blogPost.id;
        return chai.request(app)
        .put(`/posts/${blogPost.id}`)
        .send(updatePost);
      })
      .then(function(res) {
        expect(res).to.have.status(204);
        return testBlogApp.findById(updatePost.id);
      })
      .then(function(blogPost) {
        expect(blogPost.author).to.equal(updatePost.author);
        expect(blogPost.title).to.equal(updatePost.title);
      });
    });
  });

  describe('DELETE endpoint', function(){
    it('Delete a post by id', function(){
      let post;
      return testBlogApp
        .findOne()
        .then(function(_post) {
          post = _post;
          return chai.request(app).delete(`/posts/${post.id}`)
        })
        .then(function(res){
          expect(res).to.have.status(204);
          return testBlogApp.findById(post.id);
        })
        .then(function(_post) {
          expect(_post).to.be.null;
        });
    });
  });
});
