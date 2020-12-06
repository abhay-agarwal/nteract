import {
  actions,
  reducers,
  epics,
  AppState,
  createContentRef,
  createHostRef,
  createKernelRef,
  createKernelspecsRef,
  makeAppRecord,
  makeCommsRecord,
  makeContentsRecord,
  makeDummyContentRecord,
  makeEntitiesRecord,
  makeHostsRecord,
  makeJupyterHostRecord,
  makeStateRecord,
  makeTransformsRecord,
} from '@nteract/core'
import { notifications } from '@nteract/mythic-notifications'
import { makeConfigureStore } from '@nteract/myths'
import { compose } from 'redux'
import { contents } from 'rx-jupyter'

import { ContentRecord, HostRecord } from '@nteract/types'
import * as Immutable from 'immutable'
import { Provider } from 'react-redux'
import { provideStore } from 'redux-vuex'

import { Middleware } from '@nuxt/types'

const configureStore = makeConfigureStore<AppState>()({
  packages: [notifications],
  reducers: {
    app: reducers.app,
    core: reducers.core as any,
  },
  epics: epics.allEpics,
  epicDependencies: { contentProvider: contents.JupyterContentProvider },
  enhancer: (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose,
})

const jupyterHostRecord = makeJupyterHostRecord({
  id: null,
  type: 'jupyter',
  defaultKernelName: 'python',
  origin: 'http://localhost:8888',
  basePath: '/',
  bookstoreEnabled: true,
  showHeaderEditor: false,
})

const hostRef = createHostRef()
const contentRef = createContentRef()
const NullTransform = () => null
const kernelspecsRef = createKernelspecsRef()

const initialState: AppState = {
  app: makeAppRecord({
    version: `nteract-on-jupyter@2.13.1`,
    host: jupyterHostRecord,
  }),
  // comms: makeCommsRecord(),
  // config: Immutable.Map({
  //   theme: "light",
  // }),
  core: makeStateRecord({
    currentKernelspecsRef: kernelspecsRef,
    entities: makeEntitiesRecord({
      hosts: makeHostsRecord({
        byRef: Immutable.Map<string, HostRecord>().set(
          hostRef,
          jupyterHostRecord
        ),
      }),
      comms: makeCommsRecord(),
      contents: makeContentsRecord({
        byRef: Immutable.Map<string, ContentRecord>().set(
          contentRef,
          makeDummyContentRecord({
            filepath: '',
          })
        ),
      }),
      transforms: makeTransformsRecord({
        displayOrder: Immutable.List([
          'application/vnd.jupyter.widget-view+json',
          'application/vnd.vega.v5+json',
          'application/vnd.vega.v4+json',
          'application/vnd.vega.v3+json',
          'application/vnd.vega.v2+json',
          'application/vnd.vegalite.v3+json',
          'application/vnd.vegalite.v2+json',
          'application/vnd.vegalite.v1+json',
          'application/geo+json',
          'application/vnd.plotly.v1+json',
          'text/vnd.plotly.v1+html',
          'application/x-nteract-model-debug+json',
          'application/vnd.dataresource+json',
          'application/vdom.v1+json',
          'application/json',
          'application/javascript',
          'text/html',
          'text/markdown',
          'text/latex',
          'image/svg+xml',
          'image/gif',
          'image/png',
          'image/jpeg',
          'text/plain',
        ]),
        byId: Immutable.Map({
          'text/vnd.plotly.v1+html': NullTransform,
          'application/vnd.plotly.v1+json': NullTransform,
          'application/geo+json': NullTransform,
          'application/x-nteract-model-debug+json': NullTransform,
          'application/vnd.dataresource+json': NullTransform,
          'application/vnd.jupyter.widget-view+json': NullTransform,
          'application/vnd.vegalite.v1+json': NullTransform,
          'application/vnd.vegalite.v2+json': NullTransform,
          'application/vnd.vegalite.v3+json': NullTransform,
          'application/vnd.vega.v2+json': NullTransform,
          'application/vnd.vega.v3+json': NullTransform,
          'application/vnd.vega.v4+json': NullTransform,
          'application/vnd.vega.v5+json': NullTransform,
          'application/vdom.v1+json': NullTransform,
          'application/json': NullTransform,
          'application/javascript': NullTransform,
          'text/html': NullTransform,
          'text/markdown': NullTransform,
          'text/latex': NullTransform,
          'image/svg+xml': NullTransform,
          'image/gif': NullTransform,
          'image/png': NullTransform,
          'image/jpeg': NullTransform,
          'text/plain': NullTransform,
        }),
      }),
    }),
  }),
}

const kernelRef = createKernelRef()

const store = configureStore(initialState)

store.dispatch(
  actions.fetchContent({
    filepath: '',
    params: {},
    kernelRef,
    contentRef,
  })
)
store.dispatch(actions.fetchKernelspecs({ hostRef, kernelspecsRef }))

console.log(store)

const jupyterMiddleware: Middleware = ({ app }) => {
  provideStore({
    app,
    store,
    actions,
  })
}

export default jupyterMiddleware
