import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
    endpoints:(builder) => ({
        login:builder.mutation({
            query:(body) => ({
                url:"/auth/login",
                method:"POST",
                body
            })
        }),
        me:builder.query({
            query:() => "/auth/me"
        })
    })
})

export const {useLoginMutation,useMeQuery} = authApi