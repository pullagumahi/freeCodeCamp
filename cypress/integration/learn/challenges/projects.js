/* global cy */

const projects = {
  superBlock: 'machine-learning-with-python',
  block: 'machine-learning-with-python-projects',
  challenges: [
    {
      slug: 'book-recommendation-engine-using-knn',
      nextChallengeText: 'Linear Regression Health Costs Calculator'
    },
    {
      slug: 'cat-and-dog-image-classifier',
      nextChallengeText: 'Book Recommendation Engine using KNN'
    },
    {
      slug: 'linear-regression-health-costs-calculator',
      nextChallengeText: 'Neural Network SMS Text Classifier'
    },
    {
      slug: 'neural-network-sms-text-classifier',
      nextChallengeText: 'Find the Symmetric Difference'
    },
    {
      slug: 'rock-paper-scissors',
      nextChallengeText: 'Cat and Dog Image Classifier'
    }
  ]
};
describe('project submission', () => {
  // NOTE: this will fail once challenge tests are added.
  it('Should be possible to submit Python projects', () => {
    const { superBlock, block, challenges } = projects;
    challenges.forEach(({ slug, nextChallengeText }) => {
      cy.visit(`/learn/${superBlock}/${block}/${slug}`);
      cy.get('#dynamic-front-end-form')
        .get('#solution')
        .type('https://repl.it/@camperbot/python-project#main.py');

      cy.contains("I've completed this challenge").click();
      cy.contains('Go to next challenge').click();
      cy.get('.title-text').should('include.text', nextChallengeText);
    });
  });
});
