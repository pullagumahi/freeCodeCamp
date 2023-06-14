import { setupServer, superRequest } from '../../jest.utils';

const isValidChallengeCompletionErrorMsg = {
  type: 'error',
  message: 'That does not appear to be a valid challenge submission.'
};

describe('challengeRoutes', () => {
  setupServer();
  describe('Authenticated user', () => {
    let setCookies: string[];

    // Authenticate user
    beforeAll(async () => {
      const res = await superRequest('/auth/dev-callback', { method: 'GET' });
      expect(res.status).toBe(200);
      setCookies = res.get('Set-Cookie');
    });

    describe('/project-completed', () => {
      describe('validation', () => {
        it('POST rejects requests without ids', async () => {
          const response = await superRequest('/project-completed', {
            method: 'POST',
            setCookies
          }).send({});

          expect(response.body).toStrictEqual(
            isValidChallengeCompletionErrorMsg
          );
          expect(response.statusCode).toBe(400);
        });

        it('POST rejects requests without valid ObjectIDs', async () => {
          const response = await superRequest('/project-completed', {
            method: 'POST',
            setCookies
            // This is a departure from api-server, which does not require a
            // solution to give this error. However, the validator will reject
            // based on the missing solution before it gets to the invalid id.
          }).send({ id: 'not-a-valid-id', solution: '' });

          expect(response.body).toStrictEqual(
            isValidChallengeCompletionErrorMsg
          );
          expect(response.statusCode).toBe(400);
        });

        it('POST rejects requests with invalid challengeTypes', async () => {
          const response = await superRequest('/project-completed', {
            method: 'POST',
            setCookies
          }).send({
            id: 'bd7123c8c441eddfaeb5bdef',
            challengeType: 'not-a-valid-challenge-type',
            // TODO(Post-MVP): drop these comments, since the api-server will not
            // exist.

            // a solution is required, because otherwise the request will be
            // rejected before it gets to the challengeType validation. NOTE: this
            // is a departure from the api-server, but only in the message sent.
            solution: ''
          });

          expect(response.body).toStrictEqual(
            isValidChallengeCompletionErrorMsg
          );
          expect(response.statusCode).toBe(400);
        });

        it('POST rejects requests without solutions', async () => {
          const response = await superRequest('/project-completed', {
            method: 'POST',
            setCookies
          }).send({
            id: 'bd7123c8c441eddfaeb5bdef',
            challengeType: 3
          });

          expect(response.body).toStrictEqual({
            type: 'error',
            message:
              'You have not provided the valid links for us to inspect your work.'
          });
          expect(response.statusCode).toBe(400);
        });

        it('POST rejects requests with solutions that are not urls', async () => {
          const response = await superRequest('/project-completed', {
            method: 'POST',
            setCookies
          }).send({
            id: 'bd7123c8c441eddfaeb5bdef',
            challengeType: 3,
            solution: 'not-a-valid-solution'
          });

          expect(response.body).toStrictEqual(
            isValidChallengeCompletionErrorMsg
          );
          expect(response.statusCode).toBe(400);
        });

        it('POST rejects CodeRoad/CodeAlly projects when the user has not completed the required challenges', async () => {
          const response = await superRequest('/project-completed', {
            method: 'POST',
            setCookies
          }).send({
            id: 'bd7123c8c441eddfaeb5bdef', // not a codeally challenge id, but does not matter
            challengeType: 13, // this does matter, however, since there's special logic for that challenge type
            solution: 'https://any.valid/url'
          });

          expect(response.body).toStrictEqual({
            type: 'error',
            message:
              'You have to complete the project before you can submit a URL.'
          });
          // It's not really a bad request, since the client is sending a valid
          // body. It's just that the user is not allowed to do this - hence 403.
          expect(response.statusCode).toBe(403);
        });
      });

      describe('handling', () => {
        beforeEach(async () => {
          // setup: complete the challenges that codeally projects require
          await fastifyTestInstance.prisma.user.updateMany({
            where: { email: 'foo@bar.com' },
            data: {
              partiallyCompletedChallenges: [
                { id: 'bd7123c8c441eddfaeb5bdef', completedDate: 1 }
              ],
              completedChallenges: [],
              progressTimestamps: []
            }
          });
        });

        afterEach(async () => {
          await fastifyTestInstance.prisma.user.updateMany({
            where: { email: 'foo@bar.com' },
            data: {
              partiallyCompletedChallenges: [],
              completedChallenges: [],
              savedChallenges: []
            }
          });
        });

        // TODO: this test does quite a lot. It would be better to split it up.
        it('POST accepts CodeRoad/CodeAlly projects when the user has completed the required challenges', async () => {
          const now = Date.now();

          // submit the project
          const response = await superRequest('/project-completed', {
            method: 'POST',
            setCookies
          }).send({
            id: 'bd7123c8c441eddfaeb5bdef',
            challengeType: 13,
            solution: 'https://any.valid/url'
          });

          const user = await fastifyTestInstance.prisma.user.findFirst({
            where: { email: 'foo@bar.com' }
          });

          expect(user).toMatchObject({
            partiallyCompletedChallenges: [],
            completedChallenges: [
              {
                id: 'bd7123c8c441eddfaeb5bdef',
                solution: 'https://any.valid/url',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                completedDate: expect.any(Number)
              }
            ]
          });

          const completedDate = user?.completedChallenges[0]?.completedDate;

          // TODO: use a custom matcher for this
          expect(completedDate).toBeGreaterThan(now);
          expect(completedDate).toBeLessThan(now + 1000);

          expect(response.body).toStrictEqual({
            alreadyCompleted: false,
            points: 1,
            completedDate
          });

          expect(response.statusCode).toBe(200);
        });

        // TODO: this test does quite a lot. It would be better to split it up.
        it('POST accepts backend projects', async () => {
          const now = Date.now();

          // submit the project
          const response = await superRequest('/project-completed', {
            method: 'POST',
            setCookies
          }).send({
            id: 'bd7123c8c441eddfaeb5bdef',
            challengeType: 4,
            solution: 'https://any.valid/url',
            githubLink: 'https://github.com/anything/valid/'
          });

          const user = await fastifyTestInstance.prisma.user.findFirst({
            where: { email: 'foo@bar.com' }
          });

          expect(user).toMatchObject({
            partiallyCompletedChallenges: [],
            completedChallenges: [
              {
                id: 'bd7123c8c441eddfaeb5bdef',
                solution: 'https://any.valid/url',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                completedDate: expect.any(Number),
                githubLink: 'https://github.com/anything/valid/'
              }
            ]
          });

          const completedDate = user?.completedChallenges[0]?.completedDate;

          // TODO: use a custom matcher for this
          expect(completedDate).toBeGreaterThan(now);
          expect(completedDate).toBeLessThan(now + 1000);

          expect(response.body).toStrictEqual({
            alreadyCompleted: false,
            points: 1,
            completedDate
          });

          expect(response.statusCode).toBe(200);
        });

        it('POST correctly handles multiple requests', async () => {
          const projectOne = {
            id: 'bd7123c8c441eddfaeb5bdef',
            challengeType: 13,
            solution: 'https://any.valid/url'
          };
          const projectTwo = {
            id: 'bd7123c8c441eddfaeb5bdec',
            challengeType: 4,
            solution: 'https://any.valid/url',
            githubLink: 'https://github.com/anything/valid/'
          };

          await superRequest('/project-completed', {
            method: 'POST',
            setCookies
          }).send(projectOne);

          const response = await superRequest('/project-completed', {
            method: 'POST',
            setCookies
          }).send(projectTwo);

          const user = await fastifyTestInstance.prisma.user.findFirst({
            where: { email: 'foo@bar.com' }
          });

          const expectedProgressTimestamps = user?.completedChallenges.map(
            challenge => challenge.completedDate
          );

          expect(user).toMatchObject({
            completedChallenges: [
              {
                ...projectOne,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                completedDate: expect.any(Number)
              },
              {
                ...projectTwo,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                completedDate: expect.any(Number)
              }
            ],
            progressTimestamps: expectedProgressTimestamps
          });

          const completedDate = user?.completedChallenges[1]?.completedDate;

          expect(response.body).toStrictEqual({
            alreadyCompleted: false,
            points: 2,
            completedDate
          });

          expect(response.statusCode).toBe(200);
        });
      });

      // tests to add successfully non-codeAlly
      // project, resubmission,
    });
  });
  describe('Unauthenticated user', () => {
    let setCookies: string[];

    // Get the CSRF cookies from an unprotected route
    beforeAll(async () => {
      const res = await superRequest('/', { method: 'GET' });
      setCookies = res.get('Set-Cookie');
    });

    describe('/project-completed', () => {
      test('POST returns 401 status code with error message', async () => {
        const response = await superRequest('/project-completed', {
          method: 'POST',
          setCookies
        });

        expect(response?.statusCode).toBe(401);
      });
    });
  });
});
