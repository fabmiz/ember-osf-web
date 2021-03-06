import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

// eslint-disable-next-line ember/no-mixins
import ConfirmationMixin from 'ember-onbeforeunload/mixins/confirmation';

import User from 'ember-osf-web/models/user';
import CurrentUser from 'ember-osf-web/services/current-user';

// Note: This is used wholesale by all the child routes since the functionality
// is common to each of them.

export default abstract class SettingsProfileRoute extends Route.extend(ConfirmationMixin, {}) {
    @service currentUser!: CurrentUser;

    @alias('currentUser.user') user!: User;

    @computed('user', 'user.hasDirtyAttributes')
    get isPageDirty() {
        const value = this.user.hasDirtyAttributes;
        return () => value;
    }
}
