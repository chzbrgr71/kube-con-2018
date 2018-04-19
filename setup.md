## Demo Outline

### Pre-setup
- Docker containers
    docker build -t chzbrgr71/kubecon-api-ratings:v2 .
    docker build -t chzbrgr71/kubecon-api-sites .
    docker build -t chzbrgr71/kubecon-api-subjects .
    docker build --build-arg BUILD_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"` --build-arg VCS_REF=`git rev-parse --short HEAD` --build-arg IMAGE_TAG_REF=v3 -t chzbrgr71/kubecon-rating-web:v3 .

- Start with AKS cluster v1.9.1

- Pre-install API deployments and CosmosDB
    * Create CosmosDB
    * Set connect string in secret

    kubectl create secret generic cosmos-db-secret --from-literal=uri=''

    kubectl apply -f api.yaml

- Create secret for ACR (in Cloud Shell)

    export ACR_SERVER=
    export ACR_USER=
    export ACR_PWD=

    kubectl create secret docker-registry acr-secret --docker-server=$ACR_SERVER --docker-username=$ACR_USER --docker-password=$ACR_PWD --docker-email=brianisrunning@gmail.com

- OpenFaaS 
    * Follow step here: https://docs.microsoft.com/en-us/azure/aks/openfaas 
    export FAAS_GW=http://13.89.220.118:8080

    * Grafana Dashboard

        helm install --name grafana stable/grafana --version 0.5.1 --set server.service.type=LoadBalancer,server.adminUser=admin,server.adminPassword=Your@Password,server.image=grafana/grafana:4.6.3,server.persistentVolume.enabled=false --namespace openfaas
        
        * data source: http://prom-ip:9090 
        * Dashboards: 3434, 3526

    * add sms-ratings 
        
        faas-cli build -f ./sms-ratings.yml && faas-cli push -f ./sms-ratings.yml && faas-cli deploy -f ./sms-ratings.yml

        http://13.89.220.118:8080/function/sms-ratings

### Intro SMS ratings

With above setup, attendees will text the below phone numbers with votes to build database. 

Brigade pipeline will deploy web front-end.

2 stages:
    1. ACR Builder
    2. Helm deploy web app


### Live Brigade demo

- Install Brigade

    helm version

    helm repo add brigade https://azure.github.io/brigade

    helm install -n brigade brigade/brigade --set rbac.enabled=false --set vacuum.enabled=false

- Modify `brig-proj-kubecon.yaml`
    - Set Github path
    - Set shared "secret"
    - Set Github token "Personal access tokens"
    - Set ACR creds (use pre-created ACR instance `briaracrbuild.azurecr.io`)

- Add Brigade project

    helm install --name brig-proj-kubecon-web brigade/brigade-project -f brig-proj-kubecon.yaml

    helm ls

    brig project list

- Setup webhook

    kubectl get svc brigade-brigade-github-gw

    http://52.173.77.241:7744/events/github

- Create `brigade.js` 

    add in stages. build first. then add helm deploy

    az acr build -t chzbrgr71/kubecon-rating-web:master-123456 --build-args BUILD_DATE="4/19/2018 4:10pm" VCS_REF=741e61b IMAGE_TAG_REF=master-123456 -f ./Dockerfile --context . -r briaracrbuild

    helm upgrade --install --reuse-values kubecon ./app/web/charts/kubecon-rating-web --set image="briaracrbuild.azurecr.io/chzbrgr71/kubecon-rating-web" --set imageTag="master-0ce0769"
