use std::{
    future::{ready, Ready},
    rc::Rc,
};

use actix_web::{
    dev::{self, Service, ServiceRequest, ServiceResponse, Transform},
    Error,
};
// use fcc::models::challenge_model::CompletedChallenge;
use futures_util::future::LocalBoxFuture;

pub struct Send200ToNonUser;

impl<S: 'static, B> Transform<S, ServiceRequest> for Send200ToNonUser
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = Send200ToNonUserMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(Send200ToNonUserMiddleware {
            service: Rc::new(service),
        }))
    }
}

pub struct Send200ToNonUserMiddleware<S> {
    // This is special: We need this to avoid lifetime issues.
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for Send200ToNonUserMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    dev::forward_ready!(service);

    fn call(&self, service_req: ServiceRequest) -> Self::Future {
        let svc = self.service.clone();

        Box::pin(async move {
            let res = svc.call(service_req).await?;
            Ok(res)
        })
    }
}
