import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'IncidentsWebPartStrings';
import Incidents from './components/Incidents';
import { IIncidentsProps } from './components/IIncidentsProps';
import { IncidentInfo, IncidentResponse } from './components/IIncidentsProps';
import { AadHttpClient, HttpClientResponse } from '@microsoft/sp-http';

export interface IIncidentsWebPartProps {
  description: string;
}

export default class IncidentsWebPart extends BaseClientSideWebPart<IIncidentsWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {

    //const APP_ID_URL = 'api://{CLIENT_ID}';
    //const SN_INSTANCE = 'https://{INSTANCE}.service-now.com';
    const API_ENDPOINT = `${SN_INSTANCE}/api/now/table/incident?sysparm_limit=5`

    this.context.aadHttpClientFactory
    .getClient(APP_ID_URL)
    .then((client: AadHttpClient): void => {      
      client
      .get(API_ENDPOINT, AadHttpClient.configurations.v1) // Send HTTP GET Request with JWT Token
      .then(async (response: HttpClientResponse): Promise<IncidentResponse> => {
        return response.json();
      })
      .then((json: IncidentResponse): void => {
        
        // process returned data
        console.info("Binding IncidentWebPart...");
        const incidents : IncidentInfo[] = json.result;
        incidents.forEach(incident => {
          console.info(incident.number);            
        });

        const element: React.ReactElement<IIncidentsProps> = React.createElement(
          Incidents,
          {
            description: this.properties.description,
            isDarkTheme: this._isDarkTheme,
            environmentMessage: this._environmentMessage,
            hasTeamsContext: !!this.context.sdks.microsoftTeams,
            userDisplayName: this.context.pageContext.user.displayName,
            incidents: incidents
          }
        );
        ReactDom.render(element, this.domElement);

      }).catch((e) => {
        console.error('Failed to get aadclient.', e);
      });        
      
    }).catch((e) => {
      console.error('Failed to retrieve data from servicenow.', e);
    }); 

    
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
  }



  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
