import React, { Suspense } from 'react';
import { cleanup, render, act, testHook } from 'react-testing-library';
import nock from 'nock';

import { CoolerArticleResource, UserResource } from '../../__tests__/common';
import { useResource } from '../hooks';
import RestProvider from '../provider';
import NetworkManager from '../../state/NetworkManager';
import { FetchAction, ReceiveAction } from '../../types';

class MockNetworkManager extends NetworkManager {
  handleFetch(action: FetchAction, dispatch: React.Dispatch<any>) {
    const mockDispatch: typeof dispatch = (v: any) => {
      act(() => {
        dispatch(v);
      });
    };
    return super.handleFetch(action, mockDispatch);
  }
  handleReceive(action: ReceiveAction) {
    act(() => {
      super.handleReceive(action);
    });
  }
}

afterEach(cleanup);

describe('<RestProvider />', () => {
  const payload = {
    id: 5,
    title: 'hi ho',
    content: 'whatever',
    tags: ['a', 'best', 'react'],
  };
  const users = [
    {
      id: 23,
      username: 'bob',
      email: 'bob@bob.com',
      isAdmin: false,
    },
    {
      id: 7342,
      username: 'lindsey',
      email: 'lindsey@bob.com',
      isAdmin: true,
    },
  ];
  let manager: NetworkManager;
  function testProvider(callback: () => void, fbmock: jest.Mock<any, any>) {
    function Fallback() {
      fbmock();
      return null;
    }
    testHook(callback, {
      wrapper: ({ children }) => (
        <RestProvider manager={manager}>
          <Suspense fallback={<Fallback />}>{children}</Suspense>
        </RestProvider>
      ),
    });
  }

  function onError(e: any) {
    e.preventDefault();
  }
  beforeEach(() => {
    window.addEventListener('error', onError);
  });
  afterEach(() => {
    window.removeEventListener('error', onError);
  });

  beforeEach(() => {
    nock('http://test.com')
      .get(`/article-cooler/${payload.id}`)
      .reply(200, payload);
    nock('http://test.com')
      .get(`/article-cooler/0`)
      .reply(403, {});
    nock('http://test.com')
      .get(`/user/`)
      .reply(200, users);
      manager = new MockNetworkManager();
  });
  afterEach(() => {
    manager.cleanup();
  });
  function ResourceTester() {
    const article = useResource(CoolerArticleResource.singleRequest(), {
      id: payload.id,
    });
    return (
      <div>
        <h3>{article.title}</h3>
        <p>{article.content}</p>
      </div>
    );
  }
  it('should mount/umount happily', async () => {
    function Component() {
      return <>hi</>;
    }
    const tree = (
      <RestProvider manager={manager}>
        <Suspense fallback={null}>
          <Component />
        </Suspense>
      </RestProvider>
    );
    const { getByText, unmount } = render(tree);
    const hi = getByText('hi');
    expect(hi).toBeDefined();
    unmount();
  });

  it('should resolve useResource()', async () => {
    const url = CoolerArticleResource.url(payload);
    const fbmock = jest.fn();
    let article: any;
    testProvider(() => {
      article = useResource(CoolerArticleResource.singleRequest(), payload);
    }, fbmock);
    expect(fbmock).toBeCalled();
    await (manager as any).fetched[url];
    expect(article instanceof CoolerArticleResource).toBe(true);
    expect(article.title).toBe(payload.title);
  });
  /*it('useResource() should throw errors on bad network', async () => {
    const url = CoolerArticleResource.url({ id: 0 });
    const fbmock = jest.fn();
    let article: any;
    let error: any;
    testProvider(() => {
      try {
        article = useResource(CoolerArticleResource.singleRequest(), {
          id: 0,
        });
      } catch (e) {
        if (typeof e.then === 'function') throw e;
        error = e;
      }
    }, fbmock);
    expect(fbmock).toBeCalled();
    await (manager as any).fetched[url];
    expect(error).toBeDefined()
    expect(error.status).toBe(404);
  });TODO: figure out how to make superagent not fail this somehow*/
  it('should resolve parallel useResource() request', async () => {
    const url = CoolerArticleResource.url(payload);
    const userUrl = UserResource.listUrl({});
    const fbmock = jest.fn();
    let article: any, users: any;
    testProvider(() => {
      [article, users] = useResource(
        [
          CoolerArticleResource.singleRequest(),
          {
            id: payload.id,
          },
        ],
        [UserResource.listRequest(), {}]
      );
    }, fbmock);
    expect(fbmock).toBeCalled();
    await Promise.all([
      (manager as any).fetched[url],
      (manager as any).fetched[userUrl],
    ]);
    expect(article instanceof CoolerArticleResource).toBe(true);
    expect(article.title).toBe(payload.title);
    expect(users).toBeDefined();
    expect(users.length).toBeTruthy();
  });
  it('should suspend with no params to useResource()', async () => {
    const url = CoolerArticleResource.url(payload);
    const fbmock = jest.fn();
    let article: any;
    testProvider(() => {
      article = useResource(CoolerArticleResource.singleRequest(), null);
    }, fbmock);
    expect(fbmock).toBeCalledTimes(0);
    expect(url in (manager as any).fetched).toBe(false);
    expect(article).toBeNull();
  });
});
