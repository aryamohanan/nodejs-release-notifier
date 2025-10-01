const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const { fetchLatestVersion } = require('./index.js');

describe('Tests:', () => {
  let readFileStub;

  before(() => {
    // Stub fs.readFile used by readSubscribersFromFile
    readFileStub = sinon
      .stub(fs, 'readFile')
      .resolves('subscriber1@example.com\nsubscriber2@example.com\n');
  });

  after(() => {
    readFileStub.restore();
  });

  describe('fetchLatestVersion', () => {
    it('should fetch and parse the latest Node.js version with date', async () => {
      const fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        text: () =>
          Promise.resolve(`
            <a href="node-v22.4.1.pkg">node-v22.4.1.pkg</a>     08-Jul-2024 14:39       82473530
          `),
      });

      const [latestVersion, releaseDate] = await fetchLatestVersion();
      expect(latestVersion).to.equal('22.4.1');
      expect(releaseDate).to.equal('08-Jul-2024 14:39');

      fetchStub.restore();
    });

    it('should fallback if release date is missing but version exists', async () => {
      const fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        text: () =>
          Promise.resolve(`
            <a href="node-v22.5.0.pkg">node-v22.5.0.pkg</a>
          `),
      });

      const [latestVersion, releaseDate] = await fetchLatestVersion();
      expect(latestVersion).to.equal('22.5.0');
      expect(new Date(releaseDate).toString()).to.not.equal('Invalid Date'); // should be ISO fallback

      fetchStub.restore();
    });

    it('should return null if fetch fails', async () => {
      const fetchStub = sinon
        .stub(global, 'fetch')
        .rejects(new Error('Failed to fetch'));

      const result = await fetchLatestVersion();
      expect(result).to.be.null;

      fetchStub.restore();
    });

    it('should return null if no version found', async () => {
      const fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        text: () =>
          Promise.resolve('<html><body>No versions here</body></html>'),
      });

      const result = await fetchLatestVersion();
      expect(result).to.be.null;

      fetchStub.restore();
    });
  });
});
