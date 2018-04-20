import { computed } from '@ember-decorators/object';
import Component from '@ember/component';
import Node from 'ember-osf-web/models/node';
import defaultTo from 'ember-osf-web/utils/default-to';

export default class NoteworthyAndPopularProject extends Component {
    project: Node;

    @computed('project.description')
    get compactDescription(): string {
        const desc = defaultTo(this.project.description, '');
        return desc.length > 115 ? `${desc.slice(0, 111)}\u2026` : desc;
    }
}
