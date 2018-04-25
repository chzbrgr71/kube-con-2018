## Demo Outline

### Pre-setup
- Docker containers
    docker build -t chzbrgr71/kubecon-api-ratings:v4 .
    docker build -t chzbrgr71/kubecon-api-sites:v4 .
    docker build -t chzbrgr71/kubecon-api-subjects:v4 .
    docker build --build-arg BUILD_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"` --build-arg VCS_REF=`git rev-parse --short HEAD` --build-arg IMAGE_TAG_REF=v4 -t chzbrgr71/kubecon-rating-web:v4 .

- Start with AKS cluster v1.9.1

- Pre-install API deployments and CosmosDB
    * Create CosmosDB
    * Set connect string in secret

    kubectl create secret generic cosmos-db-secret --from-literal=uri=''
    (use command from Notes)

    * Install APIs
    kubectl apply -f api.yaml

- Create secret for ACR (in Cloud Shell)

    -> this step is not needed if service principal for AKS has rights

    export ACR_SERVER=
    export ACR_USER=
    export ACR_PWD=

    kubectl create secret docker-registry acr-secret --docker-server=$ACR_SERVER --docker-username=$ACR_USER --docker-password=$ACR_PWD --docker-email=brianisrunning@gmail.com

- OpenFaaS 
    * Follow step here: https://docs.microsoft.com/en-us/azure/aks/openfaas 
    export FAAS_GW=http://13.89.220.118:8080 (briar-aks-kubecon1)
    export FAAS_GW=http://13.82.92.177:8080 (briar-aks-kubecon2)

    * Grafana Dashboard

    helm install --name grafana stable/grafana --version 0.5.1 --set server.service.type=LoadBalancer,server.adminUser=admin,server.adminPassword=Your@Password,server.image=grafana/grafana:4.6.3,server.persistentVolume.enabled=false --namespace openfaas

    kubectl get service grafana-grafana -n openfaas

    export PROM_IP=$(kubectl get svc --namespace openfaas prometheus -o jsonpath='{.spec.clusterIP}')
    export PROM_URL=http://$PROM_IP:9090
    echo $PROM_URL

    * Dashboards: 3434

    * Deploy sms-ratings function
    Set `gateway` in sms-ratings.yml 
    Set `environment: API_URL` in sms-ratings.yml

    brew install faas-cli (if needed)
    
    cd /Users/brianredmond/gopath/src/github.com/chzbrgr71/kube-con-2018/open-faas/sms-ratings

    faas-cli build -f ./sms-ratings.yml && faas-cli push -f ./sms-ratings.yml && faas-cli deploy -f ./sms-ratings.yml

    * Update webhooks in Twilio (4 numbers)
    http://13.89.220.118:8080/function/sms-ratings (briar-aks-kubecon1)
    http://13.82.92.177:8080/function/sms-ratings (briar-aks-kubecon2)


### Pre-demo Prep

Remove stuff from testing: 
* Clear brig-proj-kubecon.yaml
* Clear brigade.js
* Remove web app from k8s (helm) `helm delete --purge kubecon`
* Remove brigade (helm) `helm delete --purge brigade`
* Remove brigade project (helm) `helm delete --purge brig-proj-kubecon-web`
* Remove Github webhook
* Clear ratings collection in CosmosDB
* Delete Brigade history `kubectl delete pods,secrets -l heritage=brigade`


### Live Brigade demo

- Intro SMS ratings
    With above setup, attendees will text the below phone numbers with votes to build database. Text message should include a sentence describing your "sentiment" for the language. Will be scored and converted to a 1-5 rating scale.

    Vote for:
        +1412-459-7156: Python
        +1412-459-7070: C#
        +1412-459-7326: Javascript
        +1412-459-7436: Golang

    -> Brigade pipeline will deploy web front-end.

- Install Brigade

    helm version

    helm repo add brigade https://azure.github.io/brigade

    helm install -n brigade brigade/brigade --set rbac.enabled=false --set vacuum.enabled=false

- Modify `brig-proj-kubecon.yaml`
    - Set Github path
    - Set shared "secret"
    - Set Github token "Personal access tokens"
    - Set ACR creds (use pre-created ACR instance `briaracrbuild.azurecr.io`)
    - Set Azure SP creds

- Add Brigade project

    helm install --name brig-proj-kubecon-web brigade/brigade-project -f brig-proj-kubecon.yaml

    helm ls

    brig project list

- Create `brigade.js` 

    Add in stages. build first. then add helm deploy

    1. Start with variable creation
        - gitPayload
        - ACR secrets
        - AZ secrets
        - imageTag details

    2. Write a log message with `console.log`

    3. Add job definition for `az acr build`
        
        az acr build -t chzbrgr71/kubecon-rating-web:master-123456 --build-args BUILD_DATE="4/19/2018 4:10pm" VCS_REF=741e61b IMAGE_TAG_REF=master-123456 -f ./Dockerfile --context . -r briaracrbuild

    4. Add job definition for `helm upgrade`

        helm upgrade --install --reuse-values kubecon ./app/web/charts/kubecon-rating-web --set image="briaracrbuild.azurecr.io/chzbrgr71/kubecon-rating-web" --set imageTag="master-0ce0769"

    5. Add brigade pipeline group with runEach
    
- Setup webhook

    kubectl get svc brigade-brigade-github-gw

    http://52.173.77.241:7744/events/github
    http://13.82.212.123:7744/events/github

    http://40.121.201.67:7744/events/github

- Push a change to `Footer.vue`

- Validate pipeline (split console)

    watch kubectl get pods

- Add Twilio section to `brigade.js`

    - Modify `brig-proj-kubecon.yaml` with Twilio key

        helm upgrade brig-proj-kubecon-web brigade/brigade-project -f brig-proj-kubecon.yaml

    - Add `events.on("after", (event, proj)`

        twilio sms to "4129536948" from "+14124597156" body "body"

- Update and run again