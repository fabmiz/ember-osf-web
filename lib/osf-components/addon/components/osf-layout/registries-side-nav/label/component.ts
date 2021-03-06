import { tagName } from '@ember-decorators/component';
import Component from '@ember/component';
import { assert } from '@ember/debug';
import { computed } from '@ember/object';

import { layout } from 'ember-osf-web/decorators/component';

import styles from './styles';
import template from './template';

@tagName('')
@layout(template, styles)
export default class Label extends Component {
    // Required parameters
    label!: string;

    // Optional parameters
    count?: number;

    // Private properties
    isCollapsed = false;

    @computed('count')
    get hasCount() {
        return typeof this.count === 'number';
    }

    @computed('count', 'hasCount', 'isCollapsed')
    get showCount() {
        return this.hasCount && !this.isCollapsed;
    }

    didReceiveAttrs() {
        assert(
            'OsfLayout::RegistriesSideNav::Label: @label is required for this component to render',
            Boolean(this.label),
        );
    }
}
