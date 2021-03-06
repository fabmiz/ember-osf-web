import { ModelInstance, Server } from 'ember-cli-mirage';
import config from 'ember-get-config';

import { StorageStatus } from 'ember-osf-web/models/node-storage';
import { Permission } from 'ember-osf-web/models/osf-model';
import User from 'ember-osf-web/models/user';

import { RegistrationReviewStates } from 'ember-osf-web/models/registration';
import { draftRegisterNodeMultiple, registerNodeMultiple } from '../helpers';

export function manyProjectRegistrationsScenario(
    server: Server,
    currentUser: ModelInstance<User>,
) {
    server.loadFixtures('citation-styles');

    const registrationNode = server.create(
        'node',
        {
            id: 'regis', currentUserPermissions: Object.values(Permission),
        },
        'withContributors',
    );
    server.create('contributor', {
        node: registrationNode,
        users: currentUser,
        permission: Permission.Admin,
        index: 0,
    });

    registerNodeMultiple(
        server,
        registrationNode,
        12,
        { currentUserPermissions: Object.values(Permission) },
        'withArbitraryState',
    );
    draftRegisterNodeMultiple(server, registrationNode, 12, {}, 'withRegistrationMetadata');
}

export function registrationScenario(
    server: Server,
    currentUser: ModelInstance<User>,
) {
    const { defaultProvider } = config;
    server.loadFixtures('citation-styles');

    server.create('registration-provider', {
        id: defaultProvider,
        shareSource: 'OSF Registries',
        name: 'OSF Registries',
    }, 'withAllSchemas');

    server.create('registration', { id: 'beefs' });

    const currentUserWrite = server.create('registration', {
        id: 'writr',
        registrationSchema: server.schema.registrationSchemas.find('prereg_challenge'),
        currentUserPermissions: [Permission.Read, Permission.Write],
        providerSpecificMetadata: [
            { field_name: 'Metadata field 1', field_value: '' },
            { field_name: 'Another Field', field_value: 'Value 2' },
        ],
    });

    server.create('contributor', { users: currentUser, node: currentUserWrite });

    const registrationResponses = {
        'page-one_long-text': '',
        'page-one_multi-select': ['Crocs'],
        'page-one_multi-select-other': '',
        'page-one_short-text': 'Ravioli',
        'page-one_single-select-two': 'Remember who was in NSync and who was in Backstreet Boys',
    };

    const rootNode = server.create('node', {
        id: 'anode',
        public: false,
        contributors: server.createList('contributor', 10),
        currentUserPermissions: [Permission.Admin],
    }, 'withFiles', 'withStorage');
    rootNode.update({
        storage: server.create('node-storage', { storageLimitStatus: StorageStatus.OVER_PRIVATE }),
    });
    server.create('contributor', {
        node: rootNode,
        users: currentUser,
        permission: Permission.Admin,
        index: 0,
    });

    const childNodeA = server.create('node', { parent: rootNode });
    server.create('node', { parent: childNodeA });
    server.create('node', { parent: childNodeA });
    const licenseReqFields = server.schema.licenses.findBy({ name: 'MIT License' });
    const provider = server.create('registration-provider',
        { id: 'ispor', name: 'ISPOR', allowSubmissions: true },
        'withBrand',
        'withSchemas');

    const egap = server.create('registration-provider', { id: 'egap', name: 'EGAP' },
        'withBrand', 'currentUserIsModerator');
    server.create('moderator', { provider: egap });
    server.create('moderator', { id: currentUser.id, user: currentUser, provider: egap }, 'asAdmin');
    server.createList('moderator', 5, { provider: egap });

    const decaf = server.create('registration', {
        id: 'decaf',
        title: 'Pending Penguins',
        registrationSchema: server.schema.registrationSchemas.find('testSchema'),
        provider: egap,
        reviewsState: RegistrationReviewStates.Pending,
        registeredBy: currentUser,
        currentUserPermissions: Object.values(Permission),
        providerSpecificMetadata: [
            { field_name: 'EGAP Registration ID', field_value: '' },
            { field_name: 'Another Field', field_value: 'aloha' },
        ],
    }, 'withContributors', 'withReviewActions');

    server.create('registration', {
        id: 'cuban',
        title: 'embargoed',
        registrationSchema: server.schema.registrationSchemas.find('testSchema'),
        provider: egap,
        registeredBy: currentUser,
    }, 'withContributors', 'withReviewActions', 'isEmbargo');

    server.createList('registration', 12,
        {
            reviewsState: RegistrationReviewStates.Pending,
            provider: egap,
        });
    server.create('contributor', { node: decaf }, 'unregistered');

    server.create('registration', {
        id: 'wdrwn',
        title: 'Withdrawn Hermit',
        registrationSchema: server.schema.registrationSchemas.find('testSchema'),
        provider: egap,
        reviewsState: RegistrationReviewStates.Withdrawn,
    }, 'withContributors', 'withReviewActions');

    server.create('subscription');

    server.create('registration', {
        id: 'accpt',
        title: 'Acceptember',
        registrationSchema: server.schema.registrationSchemas.find('testSchema'),
        provider,
        reviewsState: RegistrationReviewStates.Accepted,
        providerSpecificMetadata: [
            { field_name: 'Metadata field 1', field_value: '' },
            { field_name: 'Another Field', field_value: 'Value 2' },
        ],
    }, 'withContributors');

    server.create('registration', {
        id: 'cuban',
        title: 'Embargo',
        registrationSchema: server.schema.registrationSchemas.find('testSchema'),
        provider: egap,
    }, 'withContributors', 'isEmbargo');

    server.create('registration', {
        id: 'pndwd',
        title: 'Cold Turkey',
        provider: egap,
        reviewsState: RegistrationReviewStates.PendingWithdraw,
    }, 'withSingleReviewAction');

    server.create('registration', {
        id: 'aerchive',
        registrationSchema: server.schema.registrationSchemas.find('testSchema'),
        provider,
    }, 'isArchiving');

    const draftNode = server.create('draft-node', 'withFiles');
    server.create('draft-registration', {
        id: 'dcaf',
        registrationSchema: server.schema.registrationSchemas.find('open_ended_registration'),
        initiator: currentUser,
        branchedFrom: draftNode,
        hasProject: false,
        license: licenseReqFields,
        currentUserPermissions: Object.values(Permission),
    }, 'withSubjects', 'withAffiliatedInstitutions', 'withContributors');

    server.create('draft-registration', {
        id: 'brand',
        registrationSchema: server.schema.registrationSchemas.find('testSchema'),
        initiator: currentUser,
        registrationResponses,
        branchedFrom: rootNode,
        license: licenseReqFields,
        currentUserPermissions: [Permission.Read, Permission.Write],
        provider,
    }, 'withContributors');

    const clinicalTrials = server.create('external-provider', {
        shareSource: 'ClinicalTrials.gov',
    });
    const researchRegistry = server.create('external-provider', {
        shareSource: 'Research Registry',
    });

    server.createList('external-registration', 3, { provider: clinicalTrials });
    server.createList('external-registration', 2, { provider: researchRegistry });

    server.create('draft-registration', {
        id: 'rrpre',
        registrationSchema: server.schema.registrationSchemas.find('replication_recipe_pre_registration'),
        initiator: currentUser,
        registrationResponses,
        branchedFrom: rootNode,
    });

    server.create('draft-registration', {
        id: 'pregc',
        registrationSchema: server.schema.registrationSchemas.find('prereg_challenge'),
        initiator: currentUser,
        registrationResponses,
        branchedFrom: rootNode,
    });

    server.createList('subject', 10, 'withChildren');

    // Current user Bookmarks collection
    server.create('collection', { title: 'Bookmarks', bookmarks: true });
}
