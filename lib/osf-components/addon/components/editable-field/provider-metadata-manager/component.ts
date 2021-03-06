import { action } from '@ember/object';
import Store from '@ember-data/store';
import { and, reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import Intl from 'ember-intl/services/intl';
import Toast from 'ember-toastr/services/toast';

import Registration, { ProviderMetadata } from 'ember-osf-web/models/registration';
import CurrentUserService from 'ember-osf-web/services/current-user';
import captureException, { getApiErrorMessage } from 'ember-osf-web/utils/capture-exception';

export interface Args {
    registration: Registration;
}

export interface ProviderMetadataManager {
    save: () => void;
    cancel: () => void;
    startEditing: () => void;
    inEditMode: boolean;
    userCanEdit: boolean;
    shouldShowField: () => boolean;
    currentProviderMetadata: ProviderMetadata[];
    providerSpecificMetadata: ProviderMetadata[];
    isSaving: () => boolean;
    fieldIsEmpty: () => boolean;
    emptyFieldText: string;
}

function compareFieldValues(isEmpty: boolean, item: ProviderMetadata) {
    return isEmpty && !item.field_value;
}

function deepCopy(providerMetadata: ProviderMetadata[]) {
    return JSON.parse(JSON.stringify(providerMetadata));
}

export default class ProviderMetadataManagerComponent extends Component<Args> {
    @service currentUser!: CurrentUserService;
    @service intl!: Intl;
    @service store!: Store;
    @service toast!: Toast;

    @task
    async save() {
        if (this.args.registration) {
            try {
                this.args.registration.providerSpecificMetadata = deepCopy(this.currentProviderMetadata);
                await this.args.registration.save();
            } catch (e) {
                const errorMessage = this.intl.t('registries.registration_metadata.edit_provider_metadata.error');
                captureException(e, { errorMessage });
                this.args.registration.rollbackAttributes();
                this.toast.error(getApiErrorMessage(e), errorMessage);
                throw e;
            }
            this.requestedEditMode = false;
            this.toast.success(this.intl.t('registries.registration_metadata.edit_provider_metadata.success'));
        }
    }

    @tracked currentProviderMetadata: ProviderMetadata[] = [];
    @tracked requestedEditMode = false;

    @reads('args.registration.provider.currentUserCanReview') userCanEdit!: boolean;
    @and('userCanEdit', 'requestedEditMode') inEditMode!: boolean;

    constructor(owner: unknown, args: Args) {
        super(owner, args);
        this.setCurrentProviderMetadata();
    }

    get fieldIsEmpty() {
        if (this.args.registration && this.args.registration.providerSpecificMetadata) {
            return this.args.registration.providerSpecificMetadata.reduce(compareFieldValues, true);
        }
        return true;
    }

    get shouldShowField() {
        return this.userCanEdit || !this.fieldIsEmpty;
    }

    @action
    startEditing() {
        this.requestedEditMode = true;
    }

    @action
    cancel() {
        this.setCurrentProviderMetadata();
        this.requestedEditMode = false;
    }

    setCurrentProviderMetadata() {
        this.currentProviderMetadata = deepCopy(this.args.registration.providerSpecificMetadata);
    }
}
