import { click, currentRouteName } from '@ember/test-helpers';
import { ModelInstance } from 'ember-cli-mirage';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { percySnapshot } from 'ember-percy';
import { TestContext } from 'ember-test-helpers';
import { module, test } from 'qunit';

import RegistrationProviderModel from 'ember-osf-web/models/registration-provider';
import { visit } from 'ember-osf-web/tests/helpers';
import { setupEngineApplicationTest } from 'ember-osf-web/tests/helpers/engines';

interface ModerationSubmissionsTestContext extends TestContext {
    registrationProvider: ModelInstance<RegistrationProviderModel>;
}

module('Registries | Acceptance | branded.moderation | submissions', hooks => {
    setupEngineApplicationTest(hooks, 'registries');
    setupMirage(hooks);

    hooks.beforeEach(function(this: ModerationSubmissionsTestContext) {
        this.registrationProvider = server.create('registration-provider', { id: 'sbmit' });
    });

    test('logged out users are rerouted', async assert => {
        await visit('/registries/sbmit/moderation/submissions');
        assert.equal(currentRouteName(), 'registries.page-not-found', 'Logged out users are rerouted');
    });

    test('logged in, non-moderators are rerouted', async assert => {
        server.create('user', 'loggedIn');
        await visit('/registries/sbmit/moderation/submissions');
        assert.equal(currentRouteName(), 'registries.page-not-found', 'Non-moderators are rerouted');
    });

    test('Submissions pending: no registrations', async function(this: ModerationSubmissionsTestContext, assert) {
        const currentUser = server.create('user', 'loggedIn');
        server.create('moderator', {
            id: currentUser.id,
            user: currentUser,
            provider: this.registrationProvider,
        }, 'asModerator');
        await visit('/registries/sbmit/moderation/submissions');
        await percySnapshot('moderation submissions page: no registrations');
        assert.equal(currentRouteName(), 'registries.branded.moderation.submissions',
            'On the submissions page of registries reviews');

        // Pending tab
        assert.dom('[data-test-submissions-type="pending"]')
            .hasClass('selected', 'Pending is selected by default for submissions page');
        assert.dom('[data-test-registration-list-card]')
            .doesNotExist('No cards shown for pending submissions');
        assert.dom('[data-test-registration-list-none]').containsText('No pending registrations have been found',
            'Proper message is shown when no pending registrations found');

        // Accepted tab
        await click('[data-test-submissions-type="accepted"]');
        assert.dom('[data-test-submissions-type="accepted"]')
            .hasClass('selected', 'Accepted tab has been selected');
        assert.dom('[data-test-registration-list-card]')
            .doesNotExist('No cards shown for accepted submissions');
        assert.dom('[data-test-registration-list-none]').containsText('No accepted registrations have been found',
            'Proper message is shown when no accepted registrations found');

        // Rejected tab
        await click('[data-test-submissions-type="rejected"]');
        assert.dom('[data-test-submissions-type="rejected"]')
            .hasClass('selected', 'Rejected tab has been selected');
        assert.dom('[data-test-registration-list-card]')
            .doesNotExist('No cards shown for rejected submissions');
        assert.dom('[data-test-registration-list-none]').containsText('No rejected registrations have been found',
            'Proper message is shown when no rejected registrations found');

        // Withdrawn tab
        await click('[data-test-submissions-type="withdrawn"]');
        assert.dom('[data-test-submissions-type="withdrawn"]')
            .hasClass('selected', 'Withdrawn tab has been selected');
        assert.dom('[data-test-registration-list-card]')
            .doesNotExist('No cards shown for withdrawn submissions');
        assert.dom('[data-test-registration-list-none]').containsText('No withdrawn registrations have been found',
            'Proper message is shown when no withdrawn registrations found');
    });

    test('Submissions pending: many registrations', async function(this: ModerationSubmissionsTestContext, assert) {
        server.createList('registration', 12, { machineState: 'pending', provider: this.registrationProvider });
        server.createList('registration', 2, { machineState: 'accepted', provider: this.registrationProvider });
        server.createList('registration', 3, { machineState: 'rejected', provider: this.registrationProvider });
        server.createList('registration', 4, { machineState: 'withdrawn', provider: this.registrationProvider });
        const currentUser = server.create('user', 'loggedIn');
        server.create('moderator', {
            id: currentUser.id,
            user: currentUser,
            provider: this.registrationProvider,
        }, 'asAdmin');
        await visit('/registries/sbmit/moderation/submissions');
        await percySnapshot('moderation submissions page: many registrations');
        assert.equal(currentRouteName(), 'registries.branded.moderation.submissions',
            'On the submissions page of registries reviews');

        // Pending tab
        assert.dom('[data-test-ascending-sort]').exists({ count: 2 }, 'Sort button exists');
        assert.dom('[data-test-registration-list-card]').exists({ count: 10 }, '10 pending registrations shown');
        assert.dom('[data-test-registration-list-card-icon="pending"]').exists({ count: 10 }, 'Proper icons shown');
        assert.dom('[data-test-registration-list-card-title]').exists({ count: 10 }, 'Title shown');
        assert.dom('[data-test-registration-list-card-submitted]').exists({ count: 10 }, 'Submitted info shown');
        assert.dom('[data-test-registration-list-card-moderated]').doesNotExist('Moderator action is not shown');
        assert.dom('[data-test-next-page-button]').exists('Pagination shown');
        await click('[data-test-next-page-button]');
        assert.dom('[data-test-next-page-button]').hasAttribute('disabled', 'Pagination stops at 2 pages');
        assert.dom('[data-test-registration-list-card]').exists({ count: 2 }, '2 more pending registrations shown');

        // Accepted tab
        await click('[data-test-next-page-button]');
        assert.dom('[data-test-ascending-sort]').exists({ count: 2 }, 'Sort button exists');
        assert.dom('[data-test-registration-list-card]').exists({ count: 2 }, '2 accepted registrations shown');
        assert.dom('[data-test-registration-list-card-icon="accepted"]').exists({ count: 2 }, 'Proper icons shown');
        assert.dom('[data-test-registration-list-card-title]').exists({ count: 2 }, 'Title shown');
        assert.dom('[data-test-registration-list-card-submitted]').exists({ count: 2 }, 'Submitted info shown');
        assert.dom('[data-test-registration-list-card-moderated]').exists({ count: 2 }, 'Moderator action is shown');
        assert.dom('[data-test-next-page-button]').doesNotExist('No pagination shown');

        // Rejected tab
        await click('[data-test-submissions-type="rejected"]');
        assert.dom('[data-test-ascending-sort]').exists({ count: 2 }, 'Sort button exists');
        assert.dom('[data-test-registration-list-card]').exists({ count: 3 }, '3 rejected registrations shown');
        assert.dom('[data-test-registration-list-card-icon="rejected"]').exists({ count: 3 }, 'Proper icons shown');
        assert.dom('[data-test-registration-list-card-title]').exists({ count: 3 }, 'Title shown');
        assert.dom('[data-test-registration-list-card-submitted]').exists({ count: 3 }, 'Submitted info shown');
        assert.dom('[data-test-registration-list-card-moderated]').exists({ count: 3 }, 'Moderator action is shown');
        assert.dom('[data-test-next-page-button]').doesNotExist('No pagination shown');

        // Withdrawn tab
        await click('[data-test-submissions-type="withdrawn"]');
        assert.dom('[data-test-ascending-sort]').exists({ count: 2 }, 'Sort button exists');
        assert.dom('[data-test-registration-list-card]').exists({ count: 4 }, '4 withdrawn registrations shown');
        assert.dom('[data-test-registration-list-card-icon="withdrawn"]').exists({ count: 4 }, 'Proper icons shown');
        assert.dom('[data-test-registration-list-card-title]').exists({ count: 4 }, 'Title shown');
        assert.dom('[data-test-registration-list-card-submitted]').exists({ count: 4 }, 'Submitted info shown');
        assert.dom('[data-test-registration-list-card-moderated]').doesNotExist('Moderator action is not shown');
        assert.dom('[data-test-next-page-button]').doesNotExist('No pagination shown');
    });
});