import Component from '@ember/component';

import { layout } from 'ember-osf-web/decorators/component';
import { DoiManager } from 'osf-components/components/editable-field/doi-manager/component';
import template from './template';

@layout(template)
export default class NodeDoiCreate extends Component {
    manager!: DoiManager;
}
