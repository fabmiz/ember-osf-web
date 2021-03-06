import Store from '@ember-data/store';
import Component from '@ember/component';
import { assert } from '@ember/debug';
import { action, set } from '@ember/object';
import { or } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { waitFor } from '@ember/test-waiters';
import { typeOf } from '@ember/utils';
import { Changeset } from 'ember-changeset';
import { BufferedChangeset, ValidatorAction } from 'ember-changeset/types';
import { task } from 'ember-concurrency';
import Toast from 'ember-toastr/services/toast';

import ModelRegistry from 'ember-data/types/registries/model';

import { layout, requiredAction } from 'ember-osf-web/decorators/component';
import { ValidatedModelName } from 'ember-osf-web/models/osf-model';
import Analytics from 'ember-osf-web/services/analytics';
import captureException, { getApiErrorMessage } from 'ember-osf-web/utils/capture-exception';

import template from './template';

@layout(template)
export default class ValidatedModelForm<M extends ValidatedModelName> extends Component {
    // Required arguments
    @requiredAction onSave!: (changeset: BufferedChangeset) => void;

    // Optional arguments
    onError?: (e: object, changeset: BufferedChangeset) => void;
    onWillDestroy?: (model: ModelRegistry[M], changeset?: BufferedChangeset) => void;
    model?: ModelRegistry[M];
    modelName?: M; // If provided, new model instance created in constructor
    disabled = false;
    changeset!: BufferedChangeset;
    recreateModel = false;
    onDirtChange?: (dirt: boolean) => boolean;

    // Private properties
    @service store!: Store;
    @service analytics!: Analytics;
    @service toast!: Toast;

    shouldShowMessages = false;
    modelProperties: object = {};

    @or('disabled', 'saveModelTask.isRunning')
    inputsDisabled!: boolean;

    @task
    @waitFor
    async saveModelTask() {
        await this.changeset.validate();

        if (this.changeset.isValid) {
            try {
                await this.changeset.save({});
                this.onSave(this.changeset);
                if (this.modelName && this.recreateModel) {
                    set(this, 'model', this.store.createRecord(this.modelName, this.modelProperties));
                    if (this.model !== undefined) {
                        set(this, 'changeset', this.buildChangeset(this.model));
                        this._onDirtChange();
                    }
                }
                this.set('shouldShowMessages', false);
            } catch (e) {
                if (this.onError) {
                    this.onError(e, this.changeset);
                } else {
                    captureException(e);
                    this.toast.error(getApiErrorMessage(e));
                }
                throw e;
            }
        } else {
            this.set('shouldShowMessages', true);
        }
    }

    init() {
        super.init();

        if (!this.model && this.modelName) {
            this.model = this.store.createRecord(this.modelName, this.modelProperties);
        }
        if (!this.changeset && this.model) {
            const changeset = this.buildChangeset(this.model);
            set(this, 'changeset', changeset);
            this._onDirtChange();
            changeset.on('afterValidation', () => {
                if (this.onDirtChange) {
                    this._onDirtChange();
                }
            });
        }
    }

    willDestroy() {
        if (this.onWillDestroy !== undefined && this.model) {
            this.onWillDestroy(this.model, this.changeset);
        }
    }

    _onDirtChange() {
        if (typeof (this.onDirtChange) !== 'undefined') {
            this.onDirtChange(this.changeset.isDirty);
        }
    }

    // Lifted wholesale from https://github.com/offirgolan/ember-changeset-cp-validations/blob/master/addon/index.js
    // eslint-disable-next-line @typescript-eslint/no-shadow
    buildChangeset<M extends ValidatedModelName>(model: ModelRegistry[M], options?: {}) {
        // @ts-ignore (types for typeOf don't handle 'instance')
        assert('Object does not contain any validations', typeOf(model.validations) === 'instance');
        let useOptions = {};
        if (options !== undefined) {
            useOptions = options;
        }
        const validationMap = model.validations.validatableAttributes.reduce(
            (o: any, attr: string) => {
                o[attr] = true; // eslint-disable-line no-param-reassign
                return o;
            },
            {},
        );

        const validateFn: ValidatorAction = async params => {
            const { validations } = await model.validateAttribute(params.key, params.newValue);
            return validations.isValid ? true : validations.message;
        };

        return Changeset(model, validateFn, validationMap, useOptions) as BufferedChangeset;
    }

    @action
    rollback() {
        this.changeset.rollback();
        this._onDirtChange();
    }
}
