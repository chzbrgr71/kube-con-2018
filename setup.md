## Demo Outline

### Pre-setup
- Docker containers

```
docker build -t chzbrgr71/kubecon-api-ratings:v4 .
docker build -t chzbrgr71/kubecon-api-sites:v4 .
docker build -t chzbrgr71/kubecon-api-subjects:v4 .
docker build --build-arg BUILD_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"` --build-arg VCS_REF=`git rev-parse --short HEAD` --build-arg IMAGE_TAG_REF=v4 -t chzbrgr71/kubecon-rating-web:v4 .
```

- Start with AKS cluster v1.9.1 or better

```
helm init --upgrade`
kubectl -n kube-system delete deploy tiller-deploy
helm init --service-account default
```

- Pre-install API deployments and CosmosDB

    * Create CosmosDB
    * Set connect string in secret

    ```kubectl create secret generic cosmos-db-secret --from-literal=uri=''```

    * Install APIs
    ```kubectl apply -f api.yaml```

- Create secret for ACR (optional)

    -> this step is not needed if service principal for AKS has rights

```
export ACR_SERVER=
export ACR_USER=
export ACR_PWD=

kubectl create secret docker-registry acr-secret --docker-server=$ACR_SERVER --docker-username=$ACR_USER --docker-password=$ACR_PWD --docker-email=brianisrunning@gmail.com
```

- OpenFaaS (Optional)
    * Follow step here: https://docs.microsoft.com/en-us/azure/aks/openfaas 
    
    ```
    cd faas-netes
    kubectl create namespace openfaas
    kubectl create namespace openfaas-fn

    helm install --namespace openfaas -n openfaas \
    --set functionNamespace=openfaas-fn, \
    --set serviceType=LoadBalancer, \
    --set rbac=false chart/openfaas/
    
    export FAAS_GW=http://$(kubectl get svc --namespace openfaas gateway-external -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):8080

    echo $FAAS_GW
    ```
    
    * Grafana Dashboard

    ```
    helm install --name grafana stable/grafana --version 0.5.1 --set server.service.type=LoadBalancer,server.adminUser=admin,server.adminPassword=Your@Password,server.image=grafana/grafana:4.6.3,server.persistentVolume.enabled=false --namespace openfaas

    kubectl get service grafana-grafana -n openfaas

    export PROM_URL=http://$(kubectl get svc --namespace openfaas prometheus -o jsonpath='{.spec.clusterIP}'):9090

    echo $PROM_URL | pbcopy
    ```
    
    * Dashboards: 3434

    * Deploy sms-ratings function
    Set `gateway` in sms-ratings.yml 
    Set `environment: API_URL` in sms-ratings.yml

    ```
    brew install faas-cli (if needed)
    
    cd ./sms-ratings

    faas-cli build -f ./sms-ratings.yml && faas-cli push -f ./sms-ratings.yml && faas-cli deploy -f ./sms-ratings.yml
    ```

    * Update webhooks in Twilio (4 numbers)

    ```
    export TWILIO_WEBHOOK=http://$(kubectl get svc --namespace openfaas gateway-external -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):8080/function/sms-ratings

    echo $TWILIO_WEBHOOK | pbcopy
    ```

    * Test a SMS

### Pre-demo Prep

Remove stuff from testing: 
* Clear brig-proj.yaml
* Clear brigade.js
* Remove web app from k8s (helm) `helm delete --purge kubecon`
* Remove brigade (helm) `helm delete --purge brigade`
* Remove kashti `helm delete --purge kashti`
* Remove brigade project (helm) `helm delete --purge brig-proj-kubecon-web`
* Delete Brigade history `kubectl delete pods,secrets -l heritage=brigade`
* Remove Github webhook
* Clear ratings collection in CosmosDB


### Live Brigade demo

- Intro SMS ratings
    With above setup, attendees will text the below phone numbers with votes to build database. Text message should include a sentence describing your "sentiment" for the language. Will be scored and converted to a 1-5 rating scale.

    Vote for:
        +1412-459-7156: Python
        +1412-459-7070: C#
        +1412-459-7326: Javascript
        +1412-459-7436: Golang
    
    -> Show OpenFaaS Grafana Dashboard

    -> Brigade pipeline will deploy web front-end.

- Install Brigade

    ```
    helm version

    helm repo add brigade https://azure.github.io/brigade

    helm install -n brigade brigade/brigade --set rbac.enabled=false --set api.service.type=LoadBalancer
    ```

- Modify `brig-proj-kubecon.yaml`
    - Set Github path
    - Set shared "secret"
    - Set Github token "Personal access tokens"
    - Set ACR creds (use pre-created ACR instance `briaracrbuild.azurecr.io`)
    - Set Azure SP creds

- Add Brigade project

    ```
    helm install --name brig-proj-kubecon-web brigade/brigade-project -f brig-proj-kubecon.yaml

    helm ls

    brig project list
    ```

- Create `brigade.js` 

    Add in stages. build first. then add helm deploy

    1. Start with variable creation
        - ACR secrets
        - AZ secrets
        - gitPayload
        - imageTag details

    2. Write a log message with `console.log`

    3. Add job definition for `az acr build`
        
        az acr build -t chzbrgr71/kubecon-rating-web:master-123 --build-arg BUILD_DATE="4/19/2018 4:10pm" --build-arg VCS_REF=741e60b --build-arg IMAGE_TAG_REF=master-123 -f ./Dockerfile --context . -r briaracrbuild

    4. Add job definition for `helm upgrade`

        helm upgrade --install --reuse-values kubecon ./app/web/charts/kubecon-rating-web --set image="briaracrbuild.azurecr.io/chzbrgr71/kubecon-rating-web" --set imageTag="master-0ce0769"

    5. Add brigade pipeline group with runEach
    
- Setup webhook

    kubectl get svc brigade-brigade-github-gw

    export GH_WEBHOOK=http://$(kubectl get svc brigade-brigade-github-gw -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):7744/events/github

    echo $GH_WEBHOOK | pbcopy

- Setup watch `watch kubectl get pods`

- Push repo and validate

- Show kashti / `brigadeterm`

    helm install --name kashti ./charts/kashti --set service.type=LoadBalancer --set brigade.apiServer=http://10.0.65.76:7745

- Show app deployed

- Update web app and change color in `index.html`

- Also add Twitter / Twilio section to `brigade.js` and re-push

    - Modify `brig-proj-kubecon.yaml` with keys

        helm upgrade brig-proj-kubecon-web brigade/brigade-project -f brig-proj-kubecon.yaml

    - Add `events.on("after", (event, proj)`

    - Add Twilio or Twitter post code

- Update and run again

- Easy creation of Brigade GW
    http://technosophos.com/2018/04/23/building-brigade-gateways-the-easy-way.html

    * Draft setup
    az acr login -n briaracreu -g briaracr
    
    draft config set registry briaracreu.azurecr.io
    draft config set registry briaracrbuild.azurecr.io

    draft pack-repo add https://github.com/technosophos/draft-brigade

    mkdir mygateway
    cd mygateway
    draft create -p brigade-gateway

    draft up --auto-connect

    draft up && draft connect

    curl http://localhost:60929/healthz

    * Brig Simple Project
    cd brigade
    helm install brigade/brigade-project -n empty-testbed -f emptytestproj.yaml

    brig project list

    PORT=62388

    curl -XPOST http://localhost:$PORT/v1/webhook/myevent/brigade-3920c21d6f4e7ca1864c701267bd873cd1f35c99b344baad56604f -d "hello"

    draft.toml:
    
    [environments]
      [environments.development]
        name = "mygateway"
        namespace = "default"
        wait = true
        watch = false
        watch-delay = 2
        auto-connect = true
        dockerfile = ""
        chart = ""
        override-ports = ["8080:8080"]
