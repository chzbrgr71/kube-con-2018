## Demo Outline

### Pre-setup
- Docker containers
    docker build -t chzbrgr71/kubecon-api-ratings .
    docker build -t chzbrgr71/kubecon-api-sites .
    docker build -t chzbrgr71/kubecon-api-subjects .

- Start with AKS cluster v1.9.1

- Pre-install API deployments and CosmosDB
    * Create CosmosDB
    * Set connect string in secret

    kubectl create secret generic cosmos-db-secret --from-literal=uri=''

    kubectl apply -f api.yaml

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

