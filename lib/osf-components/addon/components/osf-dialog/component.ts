import { tagName } from '@ember-decorators/component';
import Component from '@ember/component';
import { action, computed } from '@ember/object';
import { or } from '@ember/object/computed';
import { inject as service } from '@ember/service';

import { layout } from 'ember-osf-web/decorators/component';
import OsfModalState from 'osf-components/services/osf-modal-state';

import styles from './styles';
import template from './template';

@tagName('')
@layout(template, styles)
export default class OsfDialog extends Component {
    @service osfModalState!: OsfModalState;

    // optional
    onClose?: () => void;
    onOpen?: () => void;
    isOpen = false;
    isModal = true;
    closeOnOutsideClick = true;
    renderInPlace = false;
    fixedWidth = false;

    // private
    hasTriggeredOpen = false;

    @or('isOpen', 'hasTriggeredOpen') shouldBeOpen!: boolean;

    @computed('osfModalState.dialogWormholeTarget', 'renderInPlace')
    get _renderInPlace() {
        return this.renderInPlace || !this.osfModalState.dialogWormholeTarget;
    }

    @action
    openDialog() {
        this.set('hasTriggeredOpen', true);
        if (this.onOpen) {
            this.onOpen();
        }
    }

    @action
    closeDialog() {
        this.set('hasTriggeredOpen', false);
        if (this.onClose) {
            this.onClose();
        }
    }

    @action
    updateModalState(newModalState: boolean) {
        if (this.isModal) {
            if (newModalState) {
                this.osfModalState.enterModalState();
            } else {
                this.osfModalState.exitModalState();
            }
        }
    }

    @action
    onClickBackground(event: MouseEvent) {
        const isOutsideDialog = event.target === event.currentTarget;
        if (isOutsideDialog && this.closeOnOutsideClick && this.isModal) {
            this.closeDialog();
        }
    }

    @action
    onKeydown(event: KeyboardEvent) {
        // Close when `esc` is pressed
        if (event.keyCode === 27) {
            this.closeDialog();
        }
    }

    willDestroy() {
        if (this.shouldBeOpen && this.osfModalState.inModalState) {
            this.osfModalState.exitModalState();
        }
    }
}
