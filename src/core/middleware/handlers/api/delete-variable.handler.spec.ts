import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import * as sinon from 'sinon';

import DeleteVariableHandler from './delete-variable.handler';
import MocksState from '../../../state/mocks.state';
import State from '../../../state/state';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

describe('DeleteVariableHandler', () => {
    let container: Container;
    let handler: DeleteVariableHandler;
    let matchingState: State;
    let mocksState: sinon.SinonStubbedInstance<MocksState>;
    let nextFn: sinon.SinonStub;
    let request: sinon.SinonStubbedInstance<http.IncomingMessage>;
    let response: sinon.SinonStubbedInstance<http.ServerResponse>;

    beforeAll(() => {
        container = new Container();
        mocksState = sinon.createStubInstance(MocksState);
        nextFn = sinon.stub();
        request = sinon.createStubInstance(http.IncomingMessage);
        response = sinon.createStubInstance(http.ServerResponse);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('MocksState').toConstantValue(mocksState);
        container.bind('DeleteVariableHandler').to(DeleteVariableHandler);

        handler = container.get<DeleteVariableHandler>('DeleteVariableHandler');
    });

    describe('handle', () => {
        beforeEach(() => {
            request.url = `${'/base-url'}/variables/one`;
            matchingState = {
                mocks: {},
                variables: JSON.parse(JSON.stringify({
                    'one': 'first',
                    'two': 'second',
                    'three': 'third'
                })),
                recordings: {},
                record: false
            };
            mocksState.getMatchingState.returns(matchingState);
        });

        it('deletes the variable', () => {
            expect(Object.keys(matchingState.variables).length).toBe(3);
            handler.handle(request as any, response as any, nextFn, { id: 'apimockId' });
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.called(response.end);
            expect(Object.keys(matchingState.variables).length).toBe(2);
        });

        afterEach(() => {
            response.writeHead.reset();
            response.end.reset();
        });
    });

    describe('isApplicable', () => {
        it('indicates applicable when url and method match', () => {
            request.url = `${'/base-url'}/variables`;
            request.method = HttpMethods.DELETE;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the method does not match', () => {
            request.url = `${'/base-url'}/variables`;
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
        it('indicates not applicable when the url does not match', () => {
            request.url = `${'/base-url'}/no-match`;
            request.method = HttpMethods.DELETE;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
    });
});