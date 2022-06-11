import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import publishEvent from '@salesforce/apex/PublishCaseViewEvent.publishCaseEvt';
import currentUserId from '@salesforce/user/Id';
export default class CaseMonitoringNotification extends LightningElement {
    channelName = '/event/Case_Record_Loaded__e';
    isSubscribeDisabled = false;
    isUnsubscribeDisabled = !this.isSubscribeDisabled;
    @track caseViewers = [];
    @track userIds = [];

    connectedCallback() {
        this.publishCaseViewEvt();
        this.registerErrorListener();
        this.handleSubscribe();
    }
 
    publishCaseViewEvt() {
        publishEvent()
            .then(result => {
                console.log('Event published succesfully');
            })
            .catch(error => {
                console.error('Error while publishing case event ' + error);
            });
    }

    // Handles subscribe button click
    handleSubscribe() {
        // Invoke subscribe method of empApi. Pass reference to messageCallback
        subscribe(this.channelName, -1, this.messageCallbackHandler).then((response) => {
            // Response contains the subscription information on subscribe call
            console.log(
                'Subscription request sent to: ',
                JSON.stringify(response)
            );
            this.subscription = response;
        });
    }
    messageCallbackHandler = (response) => {
        console.log('New message received: ', JSON.stringify(response));
        let name = response.data.payload.Current_User__c;
        let usrId = response.data.payload.CreatedById;
        let viewedTime = response.data.payload.CreatedDate;
        let userPath = "/" + usrId;

        //This condition is to avoid listening to the event for the current user load. 
        //Commenting it out because we am not able to login as other users for testing in developer org.

        //Exclude messages from current user and from duplicate users (ie. refresh page, 2 open tabs on the same record page)
        //if(this.userIds.indexOf(usrId) == -1 && usrId != currentUserId) {
            if(this.userIds.indexOf(usrId) == -1){
                this.caseViewers.push({
                    "Name" : name,
                    "Id" : usrId,
                    "UsrPath" : userPath,
                    "Time" : viewedTime
                });
                this.userIds.push(usrId);
            }

            //Notify user by a toast message
            const evt = new ShowToastEvent({
                title: 'Warning !',
                message: response.data.payload.Message_To_Dsiplay__c,
                variant: 'warning',
                mode: 'sticky'
            });
            this.dispatchEvent(evt);
        //}
    }

    registerErrorListener() {
        // Invoke onError empApi method
        onError((error) => {
            console.log('Received error from server: ', JSON.stringify(error));
            // Error contains the server-side error
        });
    }

    disconnectedCallback() {
        this.handleUnsubscribe();
    }

    handleUnsubscribe() {
        //unsubscribe method from empApi
        unsubscribe(this.subscription, response => {
            console.log('Unsubscribe event ' , JSON.stringify(response));
        });
    }
}