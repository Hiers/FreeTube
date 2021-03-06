import { profilesDb } from '../datastores'

const state = {
  profileList: [{
    _id: 'allChannels',
    name: 'All Channels',
    bgColor: '#000000',
    textColor: '#FFFFFF',
    subscriptions: []
  }],
  activeProfile: 0
}

const getters = {
  getProfileList: () => {
    return state.profileList
  },

  getActiveProfile: () => {
    return state.activeProfile
  }
}

const actions = {
  grabAllProfiles ({ rootState, dispatch, commit }, defaultName = null) {
    return new Promise((resolve, reject) => {
      profilesDb.find({}, (err, results) => {
        if (!err) {
          if (results.length === 0) {
            dispatch('createDefaultProfile', defaultName)
          } else {
            // We want the primary profile to always be first
            // So sort with that then sort alphabetically by profile name
            const profiles = results.sort((a, b) => {
              if (a._id === 'allChannels') {
                return -1
              }

              if (b._id === 'allChannels') {
                return 1
              }

              return b.name - a.name
            })

            if (state.profileList.length < profiles.length) {
              const profileIndex = profiles.findIndex((profile) => {
                return profile._id === rootState.settings.defaultProfile
              })

              if (profileIndex !== -1) {
                commit('setActiveProfile', profileIndex)
              }
            }

            commit('setProfileList', profiles)
          }

          resolve()
        } else {
          reject(err)
        }
      })
    })
  },

  grabProfileInfo (_, profileId) {
    return new Promise((resolve, reject) => {
      console.log(profileId)
      profilesDb.findOne({ _id: profileId }, (err, results) => {
        if (!err) {
          resolve(results)
        }
      })
    })
  },

  async createDefaultProfile ({ dispatch }, defaultName) {
    const randomColor = await dispatch('getRandomColor')
    const textColor = await dispatch('calculateColorLuminance', randomColor)
    const defaultProfile = {
      _id: 'allChannels',
      name: defaultName,
      bgColor: randomColor,
      textColor: textColor,
      subscriptions: []
    }

    profilesDb.update({ _id: 'allChannels' }, defaultProfile, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        dispatch('grabAllProfiles')
      }
    })
  },

  updateProfile ({ dispatch }, profile) {
    profilesDb.update({ _id: profile._id }, profile, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        dispatch('grabAllProfiles')
      }
    })
  },

  insertProfile ({ dispatch }, profile) {
    profilesDb.insert(profile, (err, newDocs) => {
      if (!err) {
        dispatch('grabAllProfiles')
      }
    })
  },

  removeProfile ({ dispatch }, profileId) {
    profilesDb.remove({ _id: profileId }, (err, numReplaced) => {
      if (!err) {
        dispatch('grabAllProfiles')
      }
    })
  },

  compactProfiles (_) {
    profilesDb.persistence.compactDatafile()
  },

  updateActiveProfile ({ commit }, index) {
    commit('setActiveProfile', index)
  }
}

const mutations = {
  setProfileList (state, profileList) {
    state.profileList = profileList
  },
  setActiveProfile (state, activeProfile) {
    state.activeProfile = activeProfile
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
