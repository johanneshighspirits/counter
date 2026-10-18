// The end-to-end tests create and delete their events in this team, also on
// production. It is left out of the start page's team list, so visitors
// never see it, unless the browser has the E2E cookie, which the tests set.
export const E2E_TEAM_SLUG = 'jaybotestteam';
export const E2E_COOKIE_NAME = 'e2e';

export const isE2eTeam = (teamSlug: string) => teamSlug === E2E_TEAM_SLUG;
